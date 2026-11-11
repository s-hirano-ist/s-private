import type { BackendEnv } from "s-private-backend/env";
import { PrismaClient, PrismaPg } from "@s-hirano-ist/s-database";
import { extendDatabase } from "@s-hirano-ist/s-infrastructure/database";
import { EventDispatcher } from "@s-hirano-ist/s-infrastructure/events/event-dispatcher";
import { LoggingEventHandler } from "@s-hirano-ist/s-infrastructure/events/logging-event-handler";
import { SystemEventHandler } from "@s-hirano-ist/s-infrastructure/events/system-event-handler";
import { createMobileChunkStore } from "@s-hirano-ist/s-infrastructure/mobile/s3-chunk-store";
import { createBackendNotificationService } from "@s-hirano-ist/s-infrastructure/notifications/pushover-service";
import { ServerLogger } from "@s-hirano-ist/s-infrastructure/observability/server-logger";
import { createVectorSearch } from "@s-hirano-ist/s-infrastructure/search/vector-search";
import { createBooksStorageService } from "@s-hirano-ist/s-infrastructure/shared/books-storage-service";
import { createImagesStorageService } from "@s-hirano-ist/s-infrastructure/shared/images-storage-service";
import { tenantContext } from "@s-hirano-ist/s-infrastructure/shared/tenant-context";
import { applyTenantFilter } from "@s-hirano-ist/s-infrastructure/shared/tenant-filter";
import { createObjectStorageClient } from "@s-hirano-ist/s-storage";
import * as Sentry from "@sentry/node";
import { readFile } from "node:fs/promises";
import { createApiApp } from "s-private-backend/api/app";
import { createApiAuth } from "s-private-backend/api/auth";
import { createApiServices } from "s-private-backend/api/composition";
import { createBackendHttpApp } from "s-private-backend/api/http-app";
import { createSignInHandler } from "s-private-backend/auth/sign-in";
import { createBackendAuth } from "s-private-backend/auth/web-auth";
import { createHttpErrorReporter } from "s-private-backend/error-reporter";
import { createEventInitializer } from "s-private-backend/events/event-setup";
import { createGigazineCronHandler } from "s-private-backend/notifications/cron";
import { createLocalSampleSeeder } from "s-private-backend/shared/local-fixtures";

export function createBackendRuntime(env: BackendEnv) {
	Sentry.init({
		dsn: env.NEXT_PUBLIC_SENTRY_DSN,
		enabled: env.NODE_ENV === "production",
		dataCollection: {
			userInfo: false,
			cookies: false,
			httpHeaders: false,
			httpBodies: [],
			urlQueryParams: false,
			databaseQueryData: false,
			stackFrameVariables: false,
		},
		beforeSend(event) {
			// OAuth query strings and request headers must never accompany diagnostics.
			delete event.request;
			delete event.breadcrumbs;
			return event;
		},
	});

	const client = new PrismaClient({
		adapter: new PrismaPg({
			connectionString: env.DATABASE_URL,
			max: 3,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 10000,
		}),
		errorFormat: env.NODE_ENV === "production" ? "minimal" : "pretty",
		log: [{ emit: "event", level: "error" }],
	});
	client.$on("error", (event) =>
		Sentry.captureException(new Error(event.message), {
			tags: { source: "prisma" },
		}),
	);
	const database = extendDatabase(
		client,
		(model, operation, args) =>
			applyTenantFilter(model, operation, args, tenantContext.getStore()),
		() => {},
	);
	const storageClient = createObjectStorageClient({
		endpoint: env.S3_ENDPOINT,
		region: env.S3_REGION,
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY,
		forcePathStyle: env.S3_FORCE_PATH_STYLE,
	});
	const images = createImagesStorageService(storageClient, env.S3_BUCKET_NAME);
	const books = createBooksStorageService(storageClient, env.S3_BUCKET_NAME);
	const chunks = createMobileChunkStore(storageClient, env.S3_BUCKET_NAME);
	const eventDispatcher = new EventDispatcher();
	const logger = new ServerLogger(
		createBackendNotificationService(env),
		Sentry,
	);
	const reportError = createHttpErrorReporter(env, async (error) => {
		Sentry.captureException(error, { tags: { source: "backend_http" } });
		await Sentry.flush(2000);
	});
	const reportCritical = (caller: string) =>
		createHttpErrorReporter(env, async (error) => {
			await logger.error(`${caller} failed`, { caller, status: 500 }, error, {
				severity: "critical",
			});
			await Sentry.flush(2000);
		});
	createEventInitializer(eventDispatcher, {
		logging: new LoggingEventHandler(logger),
		system: new SystemEventHandler(logger),
	})();
	const services = createApiServices({
		database,
		chunks,
		storage: { images, books },
		eventDispatcher,
		searchVectors: createVectorSearch({
			url: env.QDRANT_URL,
			apiKey: env.QDRANT_API_KEY,
		}),
		push: env,
		reporter: Sentry,
	});
	const { getAuth, isLocalDevAuthEnabled } = createBackendAuth(env, database, {
		failure: reportCritical("auth_initialization"),
		async recovery() {
			await logger.info(
				"Auth0 initialization recovered",
				{ caller: "auth_initialization", status: 200 },
				{ notifyCompletion: true },
			);
		},
	});
	const apiAuth = createApiAuth(env, getAuth, services.mobile, Sentry);
	const cron = createGigazineCronHandler(
		env,
		services.pushDelivery.sendPushToAll,
		reportCritical("gigazine_cron"),
	);
	const app = createBackendHttpApp({
		api: createApiApp(apiAuth, services.reads, services.mutations).fetch,
		auth: async (request) => (await getAuth()).handler(request),
		signIn: async (request) =>
			createSignInHandler(env, {
				auth: await getAuth(),
				isLocalDevAuthEnabled,
				findUser: (email) =>
					database.user.findUnique({ where: { email }, select: { id: true } }),
				seedLocalUser: createLocalSampleSeeder({
					database,
					storage: images,
					loadImage: () =>
						readFile(
							new URL(
								"../fixtures/local-sample-landscape.png",
								import.meta.url,
							),
						),
				}),
			})(request),
		cron: (request) =>
			env.BACKEND_CRON_ENABLED
				? cron(request)
				: Promise.resolve(new Response(null, { status: 404 })),
		publicOrigin: env.BETTER_AUTH_URL
			? new URL(env.BETTER_AUTH_URL).origin
			: undefined,
		isTrustedOrigin: apiAuth.isTrustedOrigin,
		reportError,
	});
	return { app, close: () => client.$disconnect() };
}
