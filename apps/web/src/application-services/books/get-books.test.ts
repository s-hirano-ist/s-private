import {
	getBookByISBN,
	getExportedBooks,
	getExportedBooksCount,
	getUnexportedBooks,
} from "@/application-services/books/get-books";
import { getBackendClient } from "@/common/backend/server-client";
import { createBackendClient, ApiHttpError } from "@s-hirano-ist/s-api-client";
import { beforeEach, expect, test, vi } from "vite-plus/test";
vi.mock("@/common/backend/server-client", () => ({
	getBackendClient: vi.fn(),
}));
const book = {
	id: "book-id",
	isbn: "9780306406157",
	title: "Book",
	markdown: null,
	imagePath: "cover.png",
	googleAuthors: ["Author"],
	googleSubTitle: "Subtitle",
	googleImgSrc: "https://books.google.com/cover",
	rating: 3,
	tags: ["a,b", "c"],
	status: "EXPORTED",
	createdAt: "2026-10-11T00:00:00Z",
	updatedAt: "2026-10-11T00:00:00Z",
	exportedAt: null,
};
beforeEach(() => vi.clearAllMocks());
function fixture(payload: unknown) {
	const fetch = vi
		.fn<typeof globalThis.fetch>()
		.mockResolvedValue(Response.json(payload));
	vi.mocked(getBackendClient).mockResolvedValue(
		createBackendClient({ baseURL: "https://backend.example/api/v1", fetch }),
	);
	return fetch;
}
test("uses ID media URLs for uploaded covers and preserves external cover fallback", async () => {
	const fetch = fixture({ data: [book], totalCount: 1, offset: 0, limit: 24 });
	expect(await getExportedBooks(0)).toEqual({
		data: [
			{
				id: book.id,
				title: book.title,
				href: book.isbn,
				image: "/api/v1/media/books/book-id/thumbnail",
				subtitle: "Subtitle",
				authors: "Author",
			},
		],
		totalCount: 1,
	});
	fetch.mockResolvedValue(
		Response.json({
			data: [{ ...book, imagePath: null }],
			totalCount: 1,
			offset: 0,
			limit: 24,
		}),
	);
	expect((await getUnexportedBooks(0)).data[0].image).toBe(book.googleImgSrc);
});
test("gets counts and viewer arrays without domain casts", async () => {
	const fetch = fixture({ count: 6 });
	expect(await getExportedBooksCount()).toBe(6);
	fetch.mockResolvedValue(Response.json(book));
	const detail = await getBookByISBN(book.isbn);
	expect(detail?.tags).toEqual(["a,b", "c"]);
	expect(detail?.googleAuthors).toEqual(["Author"]);
});
test("returns null only for missing books and propagates backend failures", async () => {
	const fetch = fixture(book);
	fetch.mockResolvedValue(
		Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 }),
	);
	expect(await getBookByISBN("9780306406157")).toBeNull();
	fetch.mockResolvedValue(
		Response.json({ error: { code: "API_UNAVAILABLE" } }, { status: 503 }),
	);
	await expect(getBookByISBN("9780306406157")).rejects.toBeInstanceOf(
		ApiHttpError,
	);
});
