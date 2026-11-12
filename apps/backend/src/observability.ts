import type { MiddlewareHandler } from "hono";
import type { BackendEnv } from "s-private-backend/env";
import {
	createOperationalTelemetry,
	observe,
	operationalAttributes,
} from "@s-hirano-ist/s-infrastructure/observability/operational-telemetry";
import * as Sentry from "@sentry/node";

export function initializeObservability(
	env: Pick<
		BackendEnv,
		| "NODE_ENV"
		| "VERCEL_ENV"
		| "NEXT_PUBLIC_SENTRY_DSN"
		| "SENTRY_RELEASE"
		| "VERCEL_GIT_COMMIT_SHA"
	>,
) {
	const environment = env.VERCEL_ENV ?? env.NODE_ENV;
	const enabled =
		env.NODE_ENV === "production" && Boolean(env.NEXT_PUBLIC_SENTRY_DSN);
	Sentry.init({
		dsn: env.NEXT_PUBLIC_SENTRY_DSN,
		enabled,
		environment,
		release: env.SENTRY_RELEASE ?? env.VERCEL_GIT_COMMIT_SHA,
		tracesSampler: ({ inheritOrSampleWith }) =>
			inheritOrSampleWith(environment === "preview" ? 0.1 : 1),
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
			delete event.user;
			delete event.request;
			delete event.breadcrumbs;
			return event;
		},
		beforeSendLog(log) {
			log.attributes = operationalAttributes(log.attributes);
			return log;
		},
		beforeSendMetric(metric) {
			metric.attributes = operationalAttributes(metric.attributes);
			return metric;
		},
		beforeSendSpan(span) {
			// Only retain bounded routing information; automatic database/HTTP spans may contain content.
			span.name =
				span.attributes["http.route"]?.toString() ??
				span.attributes["sentry.op"]?.toString() ??
				"backend operation";
			span.attributes["sentry.segment.name"] = "backend request";
			span.attributes = Object.fromEntries(
				Object.entries(span.attributes).filter(([key]) =>
					[
						"sentry.op",
						"sentry.origin",
						"sentry.environment",
						"sentry.release",
						"sentry.sdk.name",
						"sentry.sdk.version",
						"sentry.segment.name",
						"sentry.segment.id",
						"sentry.trace_lifecycle",
						"http.request.method",
						"http.response.status_code",
						"http.route",
					].includes(key),
				),
			);
			return span;
		},
	});
	return createOperationalTelemetry(Sentry, () => enabled);
}

/** Explicit request boundary also works without runtime auto-instrumentation. */
export function backendTelemetry(
	telemetry: ReturnType<typeof initializeObservability>,
): MiddlewareHandler {
	return async (c, next) => {
		const started = performance.now();
		await Sentry.withIsolationScope(() =>
			Sentry.continueTrace(
				{
					sentryTrace: c.req.header("sentry-trace"),
					baggage: c.req.header("baggage"),
				},
				() =>
					Sentry.startSpan(
						{ name: "backend request", op: "http.server" },
						async (span) => {
							try {
								await next();
							} finally {
								const route = c.req.routePath ?? "unmatched";
								const method = [
									"GET",
									"POST",
									"PUT",
									"PATCH",
									"DELETE",
									"HEAD",
									"OPTIONS",
								].includes(c.req.method)
									? c.req.method
									: "OTHER";
								const attributes = { method, route, status: c.res.status };
								observe(() => {
									Sentry.updateSpanName(span, `${method} ${route}`);
									span.setAttribute("http.route", route);
									Sentry.setHttpStatus(span, c.res.status);
								});
								telemetry.count("backend.http.requests", 1, attributes);
								telemetry.duration(
									"backend.http.duration",
									performance.now() - started,
									attributes,
								);
								if (c.res.status >= 500)
									telemetry.log("error", "Backend request failed", attributes);
							}
						},
					),
			),
		);
	};
}
