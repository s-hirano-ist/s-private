import { unstable_cache } from "next/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getExportedArticles } from "./articles/get-articles";
import { getUnexportedBooks } from "./books/get-books";
import { getExportedImages } from "./images/get-images";
import { getUnexportedNotes } from "./notes/get-notes";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn().mockResolvedValue("tenant-a"),
}));

vi.mock(
	"@/infrastructures/articles/repositories/articles-query-repository",
	() => ({
		articlesQueryRepository: {
			findMany: vi.fn().mockResolvedValue([]),
			count: vi.fn().mockResolvedValue(0),
		},
		categoryQueryRepository: {
			findMany: vi.fn().mockResolvedValue([]),
		},
	}),
);

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

vi.mock("@/infrastructures/notes/repositories/notes-query-repository", () => ({
	notesQueryRepository: {
		findMany: vi.fn().mockResolvedValue([]),
		count: vi.fn().mockResolvedValue(0),
	},
}));

describe("query cache configuration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("keys list caches by domain, tenant, status, and page", async () => {
		await getExportedArticles(48);
		await getUnexportedBooks(24);
		await getExportedImages(3);
		await getUnexportedNotes(72);

		const keyParts = vi
			.mocked(unstable_cache)
			.mock.calls.map(([, keys]) => keys);

		expect(keyParts).toContainEqual([
			"articles",
			"list",
			"tenant-a",
			"EXPORTED",
			"48",
		]);
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
			"3",
		]);
		expect(keyParts).toContainEqual([
			"notes",
			"list",
			"tenant-a",
			"UNEXPORTED",
			"72",
		]);
	});

	test("preserves tenant-scoped invalidation tags", async () => {
		await getExportedArticles(0);

		const listCall = vi
			.mocked(unstable_cache)
			.mock.calls.find(([, keys]) => keys?.[1] === "list");

		expect(listCall?.[2]).toEqual({
			tags: ["articles_EXPORTED_tenanta", "articles_EXPORTED_tenanta_0"],
		});
	});
});
