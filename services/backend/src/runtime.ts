import type { BackendEnv } from "s-private-backend/env";
import { createApiApp } from "@s-hirano-ist/s-backend/api/app";
import { createApiAuth } from "@s-hirano-ist/s-backend/api/auth";
import { createApiServices } from "@s-hirano-ist/s-backend/api/composition";
import { createBackendHttpApp } from "@s-hirano-ist/s-backend/api/http-app";
import { createSignInHandler } from "@s-hirano-ist/s-backend/auth/sign-in";
import { createBackendAuth } from "@s-hirano-ist/s-backend/auth/web-auth";
import { EventDispatcher } from "@s-hirano-ist/s-backend/events/event-dispatcher";
import { createEventInitializer } from "@s-hirano-ist/s-backend/events/event-setup";
import { LoggingEventHandler } from "@s-hirano-ist/s-backend/events/logging-event-handler";
import { SystemEventHandler } from "@s-hirano-ist/s-backend/events/system-event-handler";
import { createMobileChunkStore } from "@s-hirano-ist/s-backend/mobile/minio-chunk-store";
import { createGigazineCronHandler } from "@s-hirano-ist/s-backend/notifications/cron";
import { createBackendNotificationService } from "@s-hirano-ist/s-backend/notifications/pushover-service";
import { ServerLogger } from "@s-hirano-ist/s-backend/observability/server-logger";
import { createVectorSearch } from "@s-hirano-ist/s-backend/search/vector-search";
import { createBooksStorageService } from "@s-hirano-ist/s-backend/shared/books-storage-service";
import { extendDatabase } from "@s-hirano-ist/s-backend/shared/database";
import { createLocalSampleSeeder } from "@s-hirano-ist/s-backend/shared/local-fixtures";
import { createImagesStorageService } from "@s-hirano-ist/s-backend/shared/minio-storage-service";
import { tenantContext } from "@s-hirano-ist/s-backend/shared/tenant-context";
import { applyTenantFilter } from "@s-hirano-ist/s-backend/shared/tenant-filter";
import { PrismaClient, PrismaPg } from "@s-hirano-ist/s-database";
import { createMinioClient } from "@s-hirano-ist/s-storage";
import * as Sentry from "@sentry/node";
import { readFile } from "node:fs/promises";

export function createBackendRuntime(env: BackendEnv) {
	Sentry.init({
		dsn: env.NEXT_PUBLIC_SENTRY_DSN,
		enabled: env.NODE_ENV === "production",
		sendDefaultPii: false,
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
	const minio = createMinioClient(
		{
			endPoint: env.MINIO_HOST,
			port: env.MINIO_PORT,
			useSSL: env.MINIO_USE_SSL,
			accessKey: env.MINIO_ACCESS_KEY,
			secretKey: env.MINIO_SECRET_KEY,
		},
		{
			clientId: env.CF_ACCESS_CLIENT_ID ?? "",
			clientSecret: env.CF_ACCESS_CLIENT_SECRET ?? "",
		},
	);
	const images = createImagesStorageService(minio, env.MINIO_BUCKET_NAME);
	const books = createBooksStorageService(minio, env.MINIO_BUCKET_NAME);
	const eventDispatcher = new EventDispatcher();
	const logger = new ServerLogger(
		createBackendNotificationService(env),
		Sentry,
	);
	createEventInitializer(eventDispatcher, {
		logging: new LoggingEventHandler(logger),
		system: new SystemEventHandler(logger),
	})();
	const services = createApiServices({
		database,
		chunks: createMobileChunkStore(minio, env.MINIO_BUCKET_NAME),
		storage: { images, books },
		eventDispatcher,
		searchVectors: createVectorSearch({
			url: env.QDRANT_URL,
			apiKey: env.QDRANT_API_KEY,
		}),
		push: env,
		reporter: Sentry,
	});
	const { auth, isLocalDevAuthEnabled } = createBackendAuth(env, database);
	const apiAuth = createApiAuth(env, auth, services.mobile, Sentry);
	const seedLocalUser = createLocalSampleSeeder({
		database,
		storage: images,
		loadImage: () =>
			readFile(
				new URL(
					"../../../packages/backend/fixtures/local-sample-landscape.png",
					import.meta.url,
				),
			),
	});
	const cron = createGigazineCronHandler(
		env,
		services.pushDelivery.sendPushToAll,
	);
	const app = createBackendHttpApp({
		api: createApiApp(apiAuth, services.reads, services.mutations).fetch,
		auth: (request) => auth.handler(request),
		signIn: createSignInHandler(env, {
			auth,
			isLocalDevAuthEnabled,
			findUser: (email) =>
				database.user.findUnique({ where: { email }, select: { id: true } }),
			seedLocalUser,
		}),
		cron: (request) =>
			env.BACKEND_CRON_ENABLED
				? cron(request)
				: Promise.resolve(new Response(null, { status: 404 })),
		publicOrigin: new URL(env.BETTER_AUTH_URL).origin,
		isTrustedOrigin: apiAuth.isTrustedOrigin,
		reportError: Sentry.captureException,
	});
	return { app, close: () => client.$disconnect() };
}
