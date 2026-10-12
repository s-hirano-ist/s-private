// @vitest-environment node
import { dispatchBackendRequest } from "@/common/backend/dispatch";
import { getBackendClient } from "@/common/backend/server-client";
import { beforeEach, expect, test, vi } from "vite-plus/test";
const state = vi.hoisted(() => ({
	cookie: "session=first",
	localDevMode: "false",
	vercel: undefined as string | undefined,
}));
vi.mock("@/common/backend/dispatch", () => ({
	dispatchBackendRequest: vi.fn(),
}));
vi.mock("@/env", () => ({
	env: {
		BETTER_AUTH_URL: "https://web.example",
		get LOCAL_DEV_MODE() {
			return state.localDevMode;
		},
		get VERCEL() {
			return state.vercel;
		},
	},
}));
vi.mock("next/headers", () => ({
	headers: async () =>
		new Headers({
			cookie: state.cookie,
			authorization: "Bearer incoming-must-not-be-forwarded",
		}),
}));
vi.mock("next/navigation", () => ({
	redirect: (path: string) => {
		throw new Error(`REDIRECT:${path}`);
	},
	unauthorized: () => {
		throw new Error("UNAUTHORIZED");
	},
}));
beforeEach(() => {
	vi.clearAllMocks();
	state.cookie = "session=first";
	state.localDevMode = "false";
	state.vercel = undefined;
});
test("keeps cookies scoped to each server request and supplies a canonical trusted Origin", async () => {
	vi.mocked(dispatchBackendRequest).mockImplementation(async (request) => {
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
			.mocked(dispatchBackendRequest)
			.mock.calls.map(([request]) => request.headers.get("cookie")),
	).toEqual(["session=first", "session=second", "session=first"]);
});
test("maps an expired backend session to the Web authentication boundary", async () => {
	vi.mocked(dispatchBackendRequest).mockResolvedValue(
		Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }),
	);
	await expect((await getBackendClient()).countNotes()).rejects.toThrow(
		"UNAUTHORIZED",
	);
});

test("replaces expired local sessions through local sign-in", async () => {
	state.localDevMode = "true";
	vi.mocked(dispatchBackendRequest).mockResolvedValue(
		Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }),
	);
	await expect((await getBackendClient()).getSession()).rejects.toThrow(
		"REDIRECT:/api/sign-in",
	);
});
test("never enables local authentication bypass on Vercel", async () => {
	state.localDevMode = "true";
	state.vercel = "1";
	vi.mocked(dispatchBackendRequest).mockResolvedValue(
		Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }),
	);
	await expect((await getBackendClient()).getSession()).rejects.toThrow(
		"UNAUTHORIZED",
	);
});
