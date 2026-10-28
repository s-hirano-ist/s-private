import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { makeUrl } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import { makeISBN } from "@s-hirano-ist/s-core/books/entities/book-entity";
import { makeNoteTitle } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { makePath } from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
import { createArticlesQueryRepositories } from "@s-hirano-ist/s-infrastructure/articles/query-repository";
import { createBooksQueryRepository } from "@s-hirano-ist/s-infrastructure/books/query-repository";
import { createImagesQueryRepository } from "@s-hirano-ist/s-infrastructure/images/query-repository";
import { createNotesQueryRepository } from "@s-hirano-ist/s-infrastructure/notes/query-repository";
import { expect, test, vi } from "vitest";
const owner = makeUserId("owner");
const cases = [
	{
		model: "article",
		where: { url_userId: { url: "https://example.com", userId: owner } },
		call: (db: DatabaseClient) =>
			createArticlesQueryRepositories(db).articlesQueryRepository.existsByUrl(
				makeUrl("https://example.com"),
				owner,
			),
	},
	{
		model: "note",
		where: { title_userId: { title: "Note", userId: owner } },
		call: (db: DatabaseClient) =>
			createNotesQueryRepository(db).existsByTitle(
				makeNoteTitle("Note"),
				owner,
			),
	},
	{
		model: "book",
		where: { isbn_userId: { isbn: "9780306406157", userId: owner } },
		call: (db: DatabaseClient) =>
			createBooksQueryRepository(db).existsByISBN(
				makeISBN("9780306406157"),
				owner,
			),
	},
	{
		model: "image",
		where: { path_userId: { path: "image.png", userId: owner } },
		call: (db: DatabaseClient) =>
			createImagesQueryRepository(db).existsByPath(
				makePath("image.png", false),
				owner,
			),
	},
];
test.each(cases)(
	"$model existence reads only an owner-scoped ID, regardless of status",
	async ({ model, where, call }) => {
		const findUnique = vi.fn();
		const db = { [model]: { findUnique } } as unknown as DatabaseClient;
		for (const status of ["UNEXPORTED", "LAST_UPDATED", "EXPORTED"]) {
			findUnique.mockResolvedValue({ id: "record", status });
			expect(await call(db)).toBe(true);
		}
		expect(findUnique).toHaveBeenCalledWith({ where, select: { id: true } });
		findUnique.mockResolvedValue(null);
		expect(await call(db)).toBe(false);
	},
);
