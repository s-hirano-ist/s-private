import { unstable_cache } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { getUnexportedBooks } from "./books/get-books";
import { getExportedImages } from "./images/get-images";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn().mockResolvedValue("tenant-a"),
}));

vi.mock("@/infrastructures/books/repositories/books-query-repository", () => ({
	booksQueryRepository: {
		findMany: vi.fn().mockResolvedValue([]),
		count: vi.fn().mockResolvedValue(0),
	},
}));

vi.mock(
	"@/infrastructures/images/repositories/images-query-repository",
	() => ({
		imagesQueryRepository: {
			findMany: vi.fn().mockResolvedValue([]),
			count: vi.fn().mockResolvedValue(0),
		},
	}),
);

describe("legacy media cache configuration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("keys list caches by domain, tenant, status, and page", async () => {
		await getUnexportedBooks(24);
		await getExportedImages(48);

		const keyParts = vi
			.mocked(unstable_cache)
			.mock.calls.map(([, keys]) => keys);

		expect(keyParts).toContainEqual([
			"books",
			"list",
			"tenant-a",
			"UNEXPORTED",
			"24",
		]);
		expect(keyParts).toContainEqual([
			"images",
			"list",
			"tenant-a",
			"EXPORTED",
			"48",
		]);
	});

	test("preserves tenant-scoped invalidation tags", async () => {
		await getUnexportedBooks(0);

		const listCall = vi
			.mocked(unstable_cache)
			.mock.calls.find(([, keys]) => keys?.[1] === "list");

		expect(listCall?.[2]).toEqual({
			tags: ["books_UNEXPORTED_tenanta", "books_UNEXPORTED_tenanta_0"],
		});
	});
});
