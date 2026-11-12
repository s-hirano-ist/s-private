// @vitest-environment node
import { dispatchBackendRequest } from "@/common/backend/dispatch";
import * as Sentry from "@sentry/nextjs";
import { beforeEach, expect, test, vi } from "vite-plus/test";
vi.mock("next/navigation", async (importOriginal) =>
	importOriginal<typeof import("next/navigation")>(),
);
const state = vi.hoisted(() => ({
	backendURL: "https://backend.example",
}));
vi.mock("@/env", () => ({
	env: {
		get BACKEND_URL() {
			return state.backendURL;
		},
	},
}));
vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
	getTraceData: vi.fn(() => ({
		"sentry-trace": "12345678901234567890123456789012-1234567890123456-1",
		baggage: "sentry-release=test",
	})),
	logger: { error: vi.fn() },
	metrics: { distribution: vi.fn() },
	setHttpStatus: vi.fn(),
	startSpan: vi.fn((_options, callback) => callback({ setStatus: vi.fn() })),
}));
beforeEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
	state.backendURL = "https://backend.example";
});
test("forwards successful responses from the configured backend", async () => {
	const upstream = vi
		.fn<typeof fetch>()
		.mockResolvedValue(new Response(null, { status: 204 }));
	vi.stubGlobal("fetch", upstream);
	const response = await dispatchBackendRequest(
		new Request("https://web.example/api/v1/notes/id", { method: "DELETE" }),
	);
	expect(response.status).toBe(204);
	expect(Sentry.startSpan).toHaveBeenCalledWith(
		{ name: "DELETE notes", op: "app.backend" },
		expect.any(Function),
	);
	expect(Sentry.setHttpStatus).toHaveBeenCalledWith(expect.anything(), 204);
	expect(upstream).toHaveBeenCalledExactlyOnceWith(
		new URL("https://backend.example/api/v1/notes/id"),
		expect.objectContaining({
			method: "DELETE",
			cache: "no-store",
			redirect: "manual",
		}),
	);
});
test("remote failure returns the API contract and never falls back or retries a write", async () => {
	state.backendURL = "https://backend.example";
	const upstream = vi
		.fn<typeof fetch>()
		.mockRejectedValue(new Error("network unavailable"));
	vi.stubGlobal("fetch", upstream);
	const response = await dispatchBackendRequest(
		new Request("https://web.example/api/v1/notes", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: '{"operationId":"same"}',
		}),
	);
	expect(response.status).toBe(503);
	expect(await response.json()).toEqual({ error: { code: "API_UNAVAILABLE" } });
	expect(response.headers.get("cache-control")).toBe("private, no-store");
	expect(upstream).toHaveBeenCalledOnce();
});
test("preserves cancellation instead of returning a recoverable API failure", async () => {
	state.backendURL = "https://backend.example";
	const controller = new AbortController();
	controller.abort();
	vi.stubGlobal(
		"fetch",
		vi.fn<typeof fetch>().mockRejectedValue(new Error("aborted")),
	);
	await expect(
		dispatchBackendRequest(
			new Request("https://web.example/api/v1/session", {
				signal: controller.signal,
			}),
		),
	).rejects.toThrow("aborted");
});

test.each([
	"HANGING_PROMISE_REJECTION",
	"NEXT_PRERENDER_INTERRUPTED",
	"DYNAMIC_SERVER_USAGE",
])(
	"preserves Next.js prerender control flow (%s) without reporting a transport error",
	async (digest) => {
		const error = Object.assign(new Error("prerender interrupted"), { digest });
		vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(error));
		await expect(
			dispatchBackendRequest(new Request("https://web.example/api/v1/books")),
		).rejects.toBe(error);
		expect(Sentry.captureException).not.toHaveBeenCalled();
	},
);

test("uses the active host trace and records bounded metrics without forwarding caller trace data", async () => {
	const upstream = vi
		.fn<typeof fetch>()
		.mockResolvedValue(new Response(null, { status: 200 }));
	vi.stubGlobal("fetch", upstream);
	await dispatchBackendRequest(
		new Request("https://web.example/api/v1/notes/private-id?q=secret", {
			headers: { "sentry-trace": "untrusted", baggage: "private=secret" },
		}),
	);
	const headers = new Headers(upstream.mock.calls[0][1]?.headers);
	expect(headers.get("sentry-trace")).toBe(
		Sentry.getTraceData()["sentry-trace"],
	);
	expect(headers.get("baggage")).toBe("sentry-release=test");
	expect(Sentry.metrics.distribution).toHaveBeenCalledWith(
		"web.backend.duration",
		expect.any(Number),
		{
			unit: "millisecond",
			attributes: { method: "GET", domain: "notes", status: 200 },
		},
	);
});
test("a failed metric or log sink does not prevent the API fallback", async () => {
	vi.mocked(Sentry.logger.error).mockImplementationOnce(() => {
		throw new Error("sink failed");
	});
	vi.mocked(Sentry.metrics.distribution).mockImplementationOnce(() => {
		throw new Error("sink failed");
	});
	vi.stubGlobal(
		"fetch",
		vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")),
	);
	expect(
		(
			await dispatchBackendRequest(
				new Request("https://web.example/api/v1/notes"),
			)
		).status,
	).toBe(503);
});
