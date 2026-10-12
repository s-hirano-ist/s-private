// @vitest-environment node
import { dispatchBackendRequest } from "@/common/backend/dispatch";
import { beforeEach, expect, test, vi } from "vite-plus/test";
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
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
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
