import { ServerLogger } from "@s-hirano-ist/s-infrastructure/observability/server-logger";
import * as Sentry from "@sentry/node";
import { Hono } from "hono";
import {
	backendTelemetry,
	initializeObservability,
} from "s-private-backend/observability";
import { afterEach, expect, test, vi } from "vite-plus/test";

type TestEnvelope = Parameters<
	ReturnType<NonNullable<Sentry.NodeOptions["transport"]>>["send"]
>[0];
type InspectEnvelope = readonly [
	unknown,
	readonly (readonly [{ readonly type: string }, unknown])[],
];
const captured = vi.hoisted(() => ({ envelopes: [] as TestEnvelope[] }));
vi.mock("@sentry/node", async (original) => {
	const sdk = await original<typeof import("@sentry/node")>();
	return {
		...sdk,
		// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Match the SDK initialization callback contract.
		init: (options: Parameters<typeof sdk.init>[0]) =>
			sdk.init({
				...options,
				defaultIntegrations: false,
				transport: () => ({
					// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Transport uses the SDK envelope contract.
					send: async (envelope) => {
						captured.envelopes.push(envelope);
						return { statusCode: 200 };
					},
					flush: async () => true,
				}),
			}),
	};
});
afterEach(async () => {
	await Sentry.close();
	captured.envelopes = [];
});

test("real SDK transports correlated spans, logs and metrics without private request or logger context", async () => {
	const telemetry = initializeObservability({
		NODE_ENV: "production",
		NEXT_PUBLIC_SENTRY_DSN: "https://public@o0.ingest.sentry.io/1",
		VERCEL_ENV: "production",
		SENTRY_RELEASE: "observability-test-release",
	});
	const app = new Hono();
	app.use("*", backendTelemetry(telemetry));
	// oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- Hono owns this mutable response context.
	app.get("/notes/:id", (c) => {
		Sentry.setUser({ id: "private-user", email: "private@example.com" });
		telemetry.log("info", "Backend operation", { status: 200 });
		return c.text("private response");
	});
	const response = await app.request(
		"https://backend.example/notes/private-id?q=private-query",
		{
			headers: {
				authorization: "Bearer private-token",
				cookie: "private-cookie",
				"sentry-trace": "12345678901234567890123456789012-1234567890123456-1",
			},
		},
	);
	expect(response.status).toBe(200);
	const reporter = { captureException: vi.fn(), captureMessage: vi.fn() };
	const notification = {
		notifyInfo: vi.fn(),
		notifyError: vi.fn(),
		notifyWarning: vi.fn(),
	};
	const logger = new ServerLogger(notification, reporter, telemetry);
	await logger.info("private message", {
		caller: "private-caller",
		status: 200,
		userId: "private-user",
		additionalContext: { body: "private-body" },
	});
	await Sentry.flush(2000);
	const payload = JSON.stringify(captured.envelopes);
	const spans = captured.envelopes
		.flatMap(([, items]: InspectEnvelope) => items)
		.filter(([header]: InspectEnvelope[1][number]) => header.type === "span");
	expect(spans).not.toHaveLength(0);
	const spanPayload = JSON.stringify(spans);
	expect(spanPayload).toContain("sentry.environment");
	expect(spanPayload).toContain("sentry.release");
	expect(spanPayload).toContain("observability-test-release");
	expect(spanPayload).toContain("sentry.segment.id");
	expect(spanPayload).toContain("sentry.segment.name");
	expect(payload).toContain("backend.http.requests");
	expect(payload).toContain("backend.http.duration");
	expect(payload).toContain("Application operation");
	expect(payload).toContain("sentry.environment");
	expect(payload).toContain('"production"');
	expect(payload).toContain("sentry.release");
	expect(payload).toContain("observability-test-release");
	expect(payload).toContain("sentry.trace.parent_span_id");
	expect(payload).toContain("/notes/:id");
	expect(payload).toContain("12345678901234567890123456789012");
	for (const value of [
		"private-id",
		"private-query",
		"private-token",
		"private-cookie",
		"private response",
		"private-user",
		"private@example.com",
		"private-caller",
		"private-body",
		"private message",
	])
		expect(payload).not.toContain(value);
});

test("development does not send any envelopes", async () => {
	const telemetry = initializeObservability({
		NODE_ENV: "development",
		NEXT_PUBLIC_SENTRY_DSN: "https://public@o0.ingest.sentry.io/1",
	});
	telemetry.log("info", "Backend operation");
	telemetry.count("backend.http.requests", 1);
	await Sentry.flush(2000);
	expect(captured.envelopes).toEqual([]);
});

test("Preview sampling uses its parent decision and a ten percent root fallback", () => {
	initializeObservability({
		NODE_ENV: "production",
		VERCEL_ENV: "preview",
		NEXT_PUBLIC_SENTRY_DSN: "https://public@o0.ingest.sentry.io/1",
	});
	const sampler = Sentry.getClient()?.getOptions().tracesSampler;
	const inheritOrSampleWith = vi.fn(() => 0.75);
	expect(sampler?.({ inheritOrSampleWith, name: "test", attributes: {} })).toBe(
		0.75,
	);
	expect(inheritOrSampleWith).toHaveBeenCalledWith(0.1);
});
