import { serverLogger } from "@/infrastructures/observability/server";
import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockedEnv = {
	CACHE_INVALIDATION_SECRET: "test-secret" as string | undefined,
};

vi.mock("@/env", () => ({
	env: mockedEnv,
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

function createInvalidJsonRequest(token = "test-secret"): Request {
	return new Request("http://localhost/api/internal/cache/invalidate", {
		method: "POST",
		headers: {
			authorization: `Bearer ${token}`,
			"content-type": "application/json",
		},
		body: "{",
	});
}

describe("POST /api/internal/cache/invalidate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedEnv.CACHE_INVALIDATION_SECRET = "test-secret";
	});

	test("returns 503 when cache invalidation is not configured", async () => {
		mockedEnv.CACHE_INVALIDATION_SECRET = undefined;

		const response = await POST(
			createRequest({ domain: "books", userId: "user" }),
		);

		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toEqual({
			error: "Cache invalidation is not configured",
		});
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	test("rejects a missing bearer token", async () => {
		const request = createRequest({ domain: "books", userId: "user" });
		request.headers.delete("authorization");

		const response = await POST(request);

		expect(response.status).toBe(401);
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	test("rejects an invalid bearer token", async () => {
		const response = await POST(
			createRequest({ domain: "books", userId: "user" }, "wrong-secret"),
		);

		expect(response.status).toBe(401);
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	test.each([
		["unsupported domain", { domain: "unsupported", userId: "user" }],
		["missing domain", { userId: "user" }],
		["empty domain", { domain: "", userId: "user" }],
		["missing userId", { domain: "books" }],
		["empty userId", { domain: "books", userId: "" }],
	])("rejects %s", async (_caseName, body) => {
		const response = await POST(createRequest(body));

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Invalid request",
		});
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	test("rejects malformed JSON", async () => {
		const response = await POST(createInvalidJsonRequest());

		expect(response.status).toBe(400);
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	test("invalidates all before and after status caches", async () => {
		const response = await POST(
			createRequest({ domain: "books", userId: "user" }),
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ invalidated: 6 });
		expect(vi.mocked(revalidateTag).mock.calls).toEqual(
			[
				"books_UNEXPORTED_user",
				"books_count_UNEXPORTED_user",
				"books_LAST_UPDATED_user",
				"books_count_LAST_UPDATED_user",
				"books_EXPORTED_user",
				"books_count_EXPORTED_user",
			].map((tag) => [tag, { expire: 0 }]),
		);
	});

	test("returns a controlled 500 response and logs unexpected errors", async () => {
		const error = new Error("cache failure");
		vi.mocked(revalidateTag).mockImplementationOnce(() => {
			throw error;
		});

		const response = await POST(
			createRequest({ domain: "books", userId: "user" }),
		);

		expect(response.status).toBe(500);
		const responseBody = await response.json();
		expect(responseBody).toEqual({
			error: "Failed to invalidate content cache",
		});
		expect(serverLogger.error).toHaveBeenCalledWith(
			"Failed to invalidate content cache",
			{
				caller: "POST /api/internal/cache/invalidate",
				status: 500,
				userId: "user",
				additionalContext: {
					domain: "books",
				},
			},
			error,
		);
		expect(JSON.stringify(responseBody)).not.toContain("test-secret");
	});
});
