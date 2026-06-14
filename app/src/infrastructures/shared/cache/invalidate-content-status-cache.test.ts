import { updateTag } from "next/cache";
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
			expect(updateTag).toHaveBeenCalledTimes(6);
			expect(vi.mocked(updateTag).mock.calls.flat()).toEqual(tags);
		},
	);

	test("invalidates both sides of UNEXPORTED → LAST_UPDATED so the item disappears from Dumper", () => {
		invalidateContentStatusCache("books", "user");

		expect(updateTag).toHaveBeenCalledWith("books_UNEXPORTED_user");
		expect(updateTag).toHaveBeenCalledWith("books_count_UNEXPORTED_user");
		expect(updateTag).toHaveBeenCalledWith("books_LAST_UPDATED_user");
		expect(updateTag).toHaveBeenCalledWith("books_count_LAST_UPDATED_user");
	});

	test("invalidates both sides of LAST_UPDATED → UNEXPORTED so the item reappears in Dumper", () => {
		invalidateContentStatusCache("books", "user");

		expect(updateTag).toHaveBeenCalledWith("books_LAST_UPDATED_user");
		expect(updateTag).toHaveBeenCalledWith("books_count_LAST_UPDATED_user");
		expect(updateTag).toHaveBeenCalledWith("books_UNEXPORTED_user");
		expect(updateTag).toHaveBeenCalledWith("books_count_UNEXPORTED_user");
	});

	test("uses shared list tags instead of enumerating paginated tags", () => {
		const tags = invalidateContentStatusCache("books", "user");

		expect(tags).not.toContain("books_UNEXPORTED_user_0");
		expect(tags).not.toContain("books_LAST_UPDATED_user_0");
	});
});
