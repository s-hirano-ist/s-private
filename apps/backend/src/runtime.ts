import type { BackendEnv } from "s-private-backend/env";
import { PrismaClient, PrismaPg } from "@s-hirano-ist/s-database";
import * as Sentry from "@sentry/node";
import { createApiApp } from "s-private-backend/api/app";
import { createApiAuth } from "s-private-backend/api/auth";
import { createApiServices } from "s-private-backend/api/composition";
import { createBackendHttpApp } from "s-private-backend/api/http-app";
import { createSignInHandler } from "s-private-backend/auth/sign-in";
import { createBackendAuth } from "s-private-backend/auth/web-auth";
import { createHttpErrorReporter } from "s-private-backend/error-reporter";
import { EventDispatcher } from "s-private-backend/events/event-dispatcher";
import { createEventInitializer } from "s-private-backend/events/event-setup";
import { LoggingEventHandler } from "s-private-backend/events/logging-event-handler";
import { SystemEventHandler } from "s-private-backend/events/system-event-handler";
import { createGigazineCronHandler } from "s-private-backend/notifications/cron";
import { createBackendNotificationService } from "s-private-backend/notifications/pushover-service";
import { ServerLogger } from "s-private-backend/observability/server-logger";
import { createVectorSearch } from "s-private-backend/search/vector-search";
import { extendDatabase } from "s-private-backend/shared/database";
import { tenantContext } from "s-private-backend/shared/tenant-context";
import { applyTenantFilter } from "s-private-backend/shared/tenant-filter";
import { createUnavailableObjectStorage } from "s-private-backend/unavailable-object-storage";

export function createBackendRuntime(env: BackendEnv) {
	Sentry.init({
		dsn: env.NEXT_PUBLIC_SENTRY_DSN,
		enabled: env.NODE_ENV === "production",
		sendDefaultPii: false,
		beforeSend(event) {
			// OAuth query strings and request headers must never accompany diagnostics.
			delete event.request;
			delete event.breadcrumbs;
			return event;
		},
	});
	const reportError = createHttpErrorReporter(env, async (error) => {
		Sentry.captureException(error, { tags: { source: "backend_http" } });
		await Sentry.flush(2000);
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
	const { storage, chunks } = createUnavailableObjectStorage();
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
		chunks,
		storage: { images: storage, books: storage },
		eventDispatcher,
		searchVectors: createVectorSearch({
			url: env.QDRANT_URL,
			apiKey: env.QDRANT_API_KEY,
		}),
		push: env,
		reporter: Sentry,
	});
	const { getAuth, isLocalDevAuthEnabled } = createBackendAuth(env, database, {
		failure: reportError,
		recovery() {
			// oxlint-disable-next-line no-console -- retain recovery alongside initialization failures.
			console.info("Auth0 initialization recovered");
			Sentry.captureMessage("Auth0 initialization recovered", "info");
		},
	});
	const apiAuth = createApiAuth(env, getAuth, services.mobile, Sentry);
	const cron = createGigazineCronHandler(
		env,
		services.pushDelivery.sendPushToAll,
	);
	const app = createBackendHttpApp({
		objectStorageUnavailable: true,
		api: createApiApp(apiAuth, services.reads, services.mutations).fetch,
		auth: async (request) => (await getAuth()).handler(request),
		signIn: async (request) =>
			createSignInHandler(env, {
				auth: await getAuth(),
				isLocalDevAuthEnabled,
				findUser: (email) =>
					database.user.findUnique({ where: { email }, select: { id: true } }),
				// The local sample seeder uploads images; keep sign-in independent of MinIO.
				seedLocalUser: async () => {},
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
