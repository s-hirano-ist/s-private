import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { invalidateContentStatusCache } from "./invalidate-content-status-cache";

describe("invalidateContentStatusCache", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test.each(["articles", "books", "images", "notes"] as const)(
		"invalidates list and count tags for every %s status",
		(domain) => {
			const tags = invalidateContentStatusCache(domain, "user-123");

			expect(tags).toEqual([
				`${domain}_UNEXPORTED_user`,
				`${domain}_count_UNEXPORTED_user`,
				`${domain}_LAST_UPDATED_user`,
				`${domain}_count_LAST_UPDATED_user`,
				`${domain}_EXPORTED_user`,
				`${domain}_count_EXPORTED_user`,
			]);
			expect(revalidateTag).toHaveBeenCalledTimes(tags.length);
			expect(vi.mocked(revalidateTag).mock.calls).toEqual(
				tags.map((tag) => [tag, { expire: 0 }]),
			);
		},
	);

	test("invalidates both sides of UNEXPORTED → LAST_UPDATED so the item disappears from Dumper", () => {
		invalidateContentStatusCache("books", "user");

		expect(revalidateTag).toHaveBeenCalledWith("books_UNEXPORTED_user", {
			expire: 0,
		});
		expect(revalidateTag).toHaveBeenCalledWith("books_count_UNEXPORTED_user", {
			expire: 0,
		});
		expect(revalidateTag).toHaveBeenCalledWith("books_LAST_UPDATED_user", {
			expire: 0,
		});
		expect(revalidateTag).toHaveBeenCalledWith(
			"books_count_LAST_UPDATED_user",
			{ expire: 0 },
		);
	});

	test("invalidates both sides of LAST_UPDATED → UNEXPORTED so the item reappears in Dumper", () => {
		invalidateContentStatusCache("books", "user");

		expect(revalidateTag).toHaveBeenCalledWith("books_LAST_UPDATED_user", {
			expire: 0,
		});
		expect(revalidateTag).toHaveBeenCalledWith(
			"books_count_LAST_UPDATED_user",
			{ expire: 0 },
		);
		expect(revalidateTag).toHaveBeenCalledWith("books_UNEXPORTED_user", {
			expire: 0,
		});
		expect(revalidateTag).toHaveBeenCalledWith("books_count_UNEXPORTED_user", {
			expire: 0,
		});
	});

	test("uses shared list tags instead of enumerating paginated tags", () => {
		const tags = invalidateContentStatusCache("books", "user");

		expect(tags).not.toContain("books_UNEXPORTED_user_0");
		expect(tags).not.toContain("books_LAST_UPDATED_user_0");
	});
});
