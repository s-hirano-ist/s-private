import type { ImageCardStackInitialData } from "@/components/common/layouts/cards/types";
import type { Book, ContentStatus } from "@s-hirano-ist/s-api-client/models";
import { requireAuth } from "@/common/auth/session";
import { getBackendClient } from "@/common/backend/server-client";
import { configureContentCache } from "@/common/cache/content-cache";
import { PAGE_SIZE } from "@/common/constants";
import { ApiHttpError } from "@s-hirano-ist/s-api-client";
import { cache } from "react";

export type BookViewerData = Pick<Book, "id" | "isbn" | "title" | "rating"> &
	Partial<
		Pick<
			Book,
			| "markdown"
			| "tags"
			| "imagePath"
			| "googleSubTitle"
			| "googleDescription"
			| "googleHref"
			| "googleImgSrc"
		>
	> & { googleAuthors?: readonly string[] | null };
const page = cache(
	async (
		offset: number,
		status: ContentStatus,
	): Promise<ImageCardStackInitialData> => {
		"use cache: private";
		configureContentCache("books");
		const { data } = await (
			await getBackendClient()
		).listBooks({ offset, limit: PAGE_SIZE, status });
		return {
			data: data.data.map((book) => ({
				id: book.id,
				title: book.title,
				href: book.isbn,
				image: book.imagePath
					? `/api/v1/media/books/${encodeURIComponent(book.id)}/thumbnail`
					: (book.googleImgSrc ?? null),
				subtitle: book.googleSubTitle ?? undefined,
				authors: book.googleAuthors?.join(", "),
			})),
			totalCount: data.totalCount,
		};
	},
);
export const getUnexportedBooks = (offset: number) =>
	page(offset, "UNEXPORTED");
export const getExportedBooks = (offset: number) => page(offset, "EXPORTED");
export const getExportedBooksCount = cache(async () => {
	"use cache: private";
	configureContentCache("books");
	return (await (await getBackendClient()).countBooks({ status: "EXPORTED" }))
		.data.count;
});
export const getBookByISBN = cache(
	async (isbn: string): Promise<BookViewerData | null> => {
		"use cache: private";
		configureContentCache("books");
		await requireAuth();
		try {
			return (await (await getBackendClient()).getBookByIsbn(isbn)).data;
		} catch (error) {
			if (error instanceof ApiHttpError && error.status === 404) return null;
			throw error;
		}
	},
);
