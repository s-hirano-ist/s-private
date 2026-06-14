import { updateTag } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/env", () => ({
	env: { CACHE_INVALIDATION_SECRET: "test-secret" },
}));

const { POST } = await import("./route");

function createRequest(body: unknown, token = "test-secret"): Request {
	return new Request("http://localhost/api/internal/cache/invalidate", {
		method: "POST",
		headers: {
			authorization: `Bearer ${token}`,
			"content-type": "application/json",
		},
		body: JSON.stringify(body),
	});
}

describe("POST /api/internal/cache/invalidate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("rejects an invalid bearer token", async () => {
		const response = await POST(
			createRequest({ domain: "books", userId: "user" }, "wrong-secret"),
		);

		expect(response.status).toBe(401);
		expect(updateTag).not.toHaveBeenCalled();
	});

	test("rejects unsupported domains", async () => {
		const response = await POST(
			createRequest({ domain: "unsupported", userId: "user" }),
		);

		expect(response.status).toBe(400);
		expect(updateTag).not.toHaveBeenCalled();
	});

	test("invalidates all before and after status caches", async () => {
		const response = await POST(
			createRequest({ domain: "books", userId: "user" }),
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ invalidated: 6 });
		expect(vi.mocked(updateTag).mock.calls.flat()).toEqual([
			"books_UNEXPORTED_user",
			"books_count_UNEXPORTED_user",
			"books_LAST_UPDATED_user",
			"books_count_LAST_UPDATED_user",
			"books_EXPORTED_user",
			"books_count_EXPORTED_user",
		]);
	});
});
