import { backendApi } from "@/backend/api";
import { signIn, authHandler } from "@/backend/embedded-auth";
// @vitest-environment node
import { dispatchBackendRequest } from "@/common/backend/dispatch";
import { beforeEach, expect, test, vi } from "vite-plus/test";
const state = vi.hoisted(() => ({
	backendURL: undefined as string | undefined,
}));
vi.mock("@/env", () => ({
	env: {
		get BACKEND_URL() {
			return state.backendURL;
		},
	},
}));
vi.mock("@/backend/api", () => ({ backendApi: { fetch: vi.fn() } }));
vi.mock("@/backend/embedded-auth", () => ({
	signIn: vi.fn(),
	authHandler: vi.fn(),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
beforeEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
	state.backendURL = undefined;
});
test("uses embedded handlers only before configuration", async () => {
	vi.mocked(backendApi.fetch).mockResolvedValue(
		new Response(null, { status: 204 }),
	);
	vi.mocked(signIn).mockResolvedValue(new Response(null, { status: 307 }));
	vi.mocked(authHandler).mockResolvedValue(new Response(null, { status: 200 }));
	expect(
		(
			await dispatchBackendRequest(
				new Request("https://web.example/api/v1/notes/id", {
					method: "DELETE",
				}),
			)
		).status,
	).toBe(204);
	expect(
		(
			await dispatchBackendRequest(
				new Request("https://web.example/api/sign-in"),
			)
		).status,
	).toBe(307);
	expect(
		(
			await dispatchBackendRequest(
				new Request("https://web.example/api/auth/get-session"),
			)
		).status,
	).toBe(200);
	expect(backendApi.fetch).toHaveBeenCalledOnce();
	expect(signIn).toHaveBeenCalledOnce();
	expect(authHandler).toHaveBeenCalledOnce();
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
	expect(backendApi.fetch).not.toHaveBeenCalled();
	expect(authHandler).not.toHaveBeenCalled();
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
	expect(backendApi.fetch).not.toHaveBeenCalled();
});
