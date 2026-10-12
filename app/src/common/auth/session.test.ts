import { getSelfId, requireAuth } from "@/common/auth/session";
import { createBackendClient } from "@s-hirano-ist/s-api-client";
import { beforeEach, expect, test, vi } from "vite-plus/test";

const state = vi.hoisted(() => ({ fetch: vi.fn<typeof fetch>() }));
vi.mock("@/common/backend/server-client", () => ({
	getBackendClient: async () =>
		createBackendClient({
			baseURL: "https://web.example/api/v1",
			fetch: state.fetch,
		}),
}));

beforeEach(() => {
	state.fetch.mockReset();
	state.fetch.mockResolvedValue(
		Response.json({
			user: {
				id: "owner",
				name: "Owner",
				email: "owner@example.com",
				image: null,
			},
			expiresAt: "2099-01-01T00:00:00.000Z",
		}),
	);
});

test("resolves the owner through the generated session contract", async () => {
	await expect(getSelfId()).resolves.toBe("owner");
	expect(state.fetch.mock.calls[0]?.[0]).toEqual(
		new URL("https://web.example/api/v1/session"),
	);
	expect(state.fetch.mock.calls[0]?.[1]?.cache).toBe("no-store");
});
test("authenticates page boundaries through the same API", async () => {
	await expect(requireAuth()).resolves.toBeUndefined();
	expect(state.fetch).toHaveBeenCalledTimes(1);
});
test("rejects malformed successful session responses", async () => {
	state.fetch.mockResolvedValue(Response.json({ user: { id: "owner" } }));
	await expect(requireAuth()).rejects.toThrow(
		"API response does not match its contract",
	);
});
test("does not accept a failed backend authentication response", async () => {
	state.fetch.mockResolvedValue(
		Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }),
	);
	await expect(getSelfId()).rejects.toThrow("UNAUTHORIZED");
});
