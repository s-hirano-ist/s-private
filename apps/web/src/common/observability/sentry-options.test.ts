import type { ErrorEvent } from "@sentry/nextjs";
import {
	sentryPrivacyOptions,
	telemetryUrl,
} from "@/common/observability/sentry-options";
import { describe, expect, test } from "vite-plus/test";

describe("Sentry telemetry privacy", () => {
	test("removes query and fragment without losing relative/absolute request paths", () => {
		expect(
			telemetryUrl("https://web.example/api/v1/search?q=private#token"),
		).toBe("https://web.example/api/v1/search");
		expect(telemetryUrl("/ja/notes#private")).toBe("/ja/notes");
	});
	test("drops content-bearing breadcrumbs and scrubs navigation/network URLs", () => {
		expect(
			sentryPrivacyOptions.beforeBreadcrumb({
				category: "console",
				message: "private note",
			}),
		).toBeNull();
		expect(
			sentryPrivacyOptions.beforeBreadcrumb({
				category: "ui.click",
				message: "private title",
			}),
		).toBeNull();
		expect(
			sentryPrivacyOptions.beforeBreadcrumb({
				category: "fetch",
				data: { url: "/api/v1/search?q=private", status_code: 200 },
			}),
		).toEqual({
			category: "fetch",
			data: { url: "/api/v1/search", status_code: 200 },
		});
	});
	test("preserves error and trace correlation while removing HTTP content and identity", () => {
		const event: ErrorEvent = {
			type: undefined,
			event_id: "event",
			user: { email: "private@example.com" },
			request: {
				url: "https://web.example?code=secret",
				data: "private note",
				cookies: { session: "secret" },
				headers: { authorization: "Bearer secret" },
				query_string: "code=secret",
			},
			contexts: { trace: { trace_id: "trace", span_id: "span" } },
		};
		expect(sentryPrivacyOptions.beforeSend(event)).toEqual({
			type: undefined,
			event_id: "event",
			request: { url: "https://web.example" },
			contexts: { trace: { trace_id: "trace", span_id: "span" } },
		});
	});
	test("preserves SDK 11 streamed Web Vitals and timings while scrubbing sensitive span attributes", () => {
		const span: Parameters<typeof sentryPrivacyOptions.beforeSendSpan>[0] = {
			trace_id: "trace",
			span_id: "span",
			name: "GET /api/v1/search?q=private",
			start_timestamp: 1,
			end_timestamp: 2,
			status: "ok",
			is_segment: true,
			attributes: {
				"browser.web_vital.lcp.value": 2600,
				"http.request.method": "GET",
				"url.full": "https://web.example?q=private",
				"http.request.header.authorization": "secret",
				"http.request.body": "private",
				"url.query": "q=private",
			},
		};
		const result = sentryPrivacyOptions.beforeSendSpan(span);
		expect(result.attributes).toEqual({
			"browser.web_vital.lcp.value": 2600,
			"http.request.method": "GET",
			"url.full": "https://web.example",
		});
		expect(result.name).toBe("GET /api/v1/search");
		expect(result.trace_id).toBe("trace");
	});
});

test("operational telemetry preserves environment and release without user enrichment", () => {
	const attributes = {
		domain: "notes",
		status: 200,
		"sentry.environment": "production",
		"sentry.release": "test-release",
		"sentry.trace.parent_span_id": "1234567890123456",
		"user.id": "private-user",
		cookie: "private-cookie",
		"http.url": "/notes?q=private-query",
	};
	const expected = {
		domain: "notes",
		status: 200,
		"sentry.environment": "production",
		"sentry.release": "test-release",
		"sentry.trace.parent_span_id": "1234567890123456",
	};
	expect(
		sentryPrivacyOptions.beforeSendLog({
			message: "Backend transport failed",
			level: "error",
			attributes,
		}).attributes,
	).toEqual(expected);
	expect(
		sentryPrivacyOptions.beforeSendMetric({
			name: "web.backend.duration",
			type: "distribution",
			value: 20,
			attributes,
		}).attributes,
	).toEqual(expected);
});
