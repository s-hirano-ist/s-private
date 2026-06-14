import { describe, expect, test, vi } from "vitest";
import { invalidateContentCache } from "./cache-invalidation-client.ts";

describe("invalidateContentCache", () => {
	test("calls the authenticated internal endpoint for the user and domain", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValue(
				new Response(JSON.stringify({ invalidated: 6 }), { status: 200 }),
			);

		await invalidateContentCache(
			{ url: "https://example.com/api/internal/cache/invalidate", secret: "s" },
			"books",
			"user",
			fetchMock,
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://example.com/api/internal/cache/invalidate",
			{
				method: "POST",
				headers: {
					authorization: "Bearer s",
					"content-type": "application/json",
				},
				body: JSON.stringify({ domain: "books", userId: "user" }),
			},
		);
	});

	test("throws with the response details so the caller logs and notifies failure", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValue(new Response("unauthorized", { status: 401 }));

		await expect(
			invalidateContentCache(
				{ url: "https://example.com", secret: "wrong" },
				"notes",
				"user",
				fetchMock,
			),
		).rejects.toThrow("Cache invalidation failed (401): unauthorized");
	});
});
