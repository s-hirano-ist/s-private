// @vitest-environment node
import { backendApi } from "@/backend/api";
import { getBackendClient } from "@/common/backend/server-client";
import { beforeEach, expect, test, vi } from "vite-plus/test";
const state = vi.hoisted(() => ({ cookie: "session=first" }));
vi.mock("@/backend/api", () => ({ backendApi: { fetch: vi.fn() } }));
vi.mock("@/env", () => ({ env: { BETTER_AUTH_URL: "https://web.example" } }));
vi.mock("next/headers", () => ({
	headers: async () =>
		new Headers({
			cookie: state.cookie,
			authorization: "Bearer incoming-must-not-be-forwarded",
		}),
}));
vi.mock("next/navigation", () => ({
	unauthorized: () => {
		throw new Error("UNAUTHORIZED");
	},
}));
beforeEach(() => {
	vi.clearAllMocks();
	state.cookie = "session=first";
});
test("keeps cookies scoped to each server request and supplies a canonical trusted Origin", async () => {
	vi.mocked(backendApi.fetch).mockImplementation(async (request) => {
		expect(request.headers.get("origin")).toBe("https://web.example");
		expect(request.headers.has("authorization")).toBe(false);
		return Response.json({ count: 1 });
	});
	const first = await getBackendClient();
	state.cookie = "session=second";
	const second = await getBackendClient();
	expect((await first.countNotes()).data.count).toBe(1);
	expect((await second.countNotes()).data.count).toBe(1);
	expect((await first.countNotes()).data.count).toBe(1);
	expect(
		vi
			.mocked(backendApi.fetch)
			.mock.calls.map(([request]) => request.headers.get("cookie")),
	).toEqual(["session=first", "session=second", "session=first"]);
});
test("maps an expired backend session to the Web authentication boundary", async () => {
	vi.mocked(backendApi.fetch).mockResolvedValue(
		Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }),
	);
	await expect((await getBackendClient()).countNotes()).rejects.toThrow(
		"UNAUTHORIZED",
	);
});
