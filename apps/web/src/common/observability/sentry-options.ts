import type { init } from "@sentry/nextjs";

type Options = Parameters<typeof init>[0];

/** SKIP_ENV_VALIDATION exposes raw strings rather than Zod output. */
export function resolveTraceSampleRate(value: unknown): number {
	const rate = Number(value ?? 1);
	return Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : 1;
}

/** Queries can contain search text, OAuth codes and signed media credentials. */
export function telemetryUrl(value: string): string {
	return value.split(/[?#]/u)[0] ?? "";
}

export function operationalAttributes(
	attributes: Record<string, unknown> = {},
) {
	return Object.fromEntries(
		Object.entries(attributes).filter(([key]) =>
			[
				"method",
				"route",
				"domain",
				"status",
				"job",
				"sentry.environment",
				"sentry.release",
				"sentry.sdk.name",
				"sentry.sdk.version",
				"sentry.trace.parent_span_id",
				"sentry.replay_id",
			].includes(key),
		),
	);
}

/** Shared by the browser, Node and Edge; no application content is added to telemetry. */
export const sentryPrivacyOptions = {
	dataCollection: {
		userInfo: false,
		cookies: false,
		httpHeaders: false,
		httpBodies: [],
		urlQueryParams: false,
		databaseQueryData: false,
		stackFrameVariables: false,
	},
	maxBreadcrumbs: 30,
	beforeSendLog(log) {
		log.attributes = operationalAttributes(log.attributes);
		return log;
	},
	beforeSendMetric(metric) {
		metric.attributes = operationalAttributes(metric.attributes);
		return metric;
	},
	beforeBreadcrumb(breadcrumb) {
		// Console messages and DOM selectors can contain private content or input values.
		if (
			breadcrumb.category === "console" ||
			breadcrumb.category?.startsWith("ui.")
		)
			return null;
		if (breadcrumb.data) {
			for (const key of ["url", "from", "to"]) {
				const value: unknown = breadcrumb.data[key];
				if (typeof value === "string")
					breadcrumb.data[key] = telemetryUrl(value);
			}
		}
		return breadcrumb;
	},
	beforeSend(event) {
		delete event.user;
		if (event.request) {
			delete event.request.data;
			delete event.request.cookies;
			delete event.request.headers;
			delete event.request.query_string;
			if (event.request.url)
				event.request.url = telemetryUrl(event.request.url);
		}
		return event;
	},
	beforeSendSpan(span) {
		span.name = telemetryUrl(span.name);
		span.attributes = Object.fromEntries(
			Object.entries(span.attributes)
				.filter(
					([key]) =>
						!/query|cookie|authorization|header|request\.body|response\.body/iu.test(
							key,
						),
				)
				.map(([key, value]) => [
					key,
					typeof value === "string" && /url|http\.target/iu.test(key)
						? telemetryUrl(value)
						: value,
				]),
		);
		return span;
	},
} satisfies Partial<Options>;
