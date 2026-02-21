/**
 * Book query application services.
 *
 * @remarks
 * Provides cached data access for books with pagination support.
 * Books are identified by ISBN and include Google Books metadata.
 *
 * @module
 */

import { makeISBN } from "@s-hirano-ist/s-core/books/entities/book-entity";
import {
	makeExportedStatus,
	makeUnexportedStatus,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import type { GetCount, GetPaginatedData } from "@/common/types";
import type { ImageCardStackInitialData } from "@/components/common/layouts/cards/types";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";
import {
	buildContentCacheTag,
	buildCountCacheTag,
	buildPaginatedContentCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import { booksStorageService } from "@/infrastructures/shared/storage/books-storage-service";

const API_BOOK_THUMBNAIL_PATH = "/api/books/images/thumbnail";

/**
 * Fetches paginated books with cache support.
 *
 * @internal
 */
const _getBooks = async (
	currentCount: number,
	userId: UserId,
	status: Status,
): Promise<ImageCardStackInitialData> => {
	"use cache";
	cacheTag(
		buildContentCacheTag("books", status, userId),
		buildPaginatedContentCacheTag("books", status, userId, currentCount),
	);

	const [books, totalCount] = await Promise.all([
		booksQueryRepository.findMany(userId, status, {
			skip: currentCount,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
		}),
		_getBooksCount(userId, status),
	]);

	return {
		data: books.map((d) => ({
			id: d.id,
			title: d.title,
			href: d.isbn,
			image: d.imagePath
				? `${API_BOOK_THUMBNAIL_PATH}/${d.imagePath}`
				: (d.googleImgSrc ?? null),
			subtitle: d.googleSubTitle ? String(d.googleSubTitle) : undefined,
			authors: d.googleAuthors
				? (d.googleAuthors as unknown as string[]).join(", ")
				: undefined,
		})),
		totalCount,
	};
};

/**
 * Gets total count of books for a user and status.
 *
 * @internal
 */
const _getBooksCount = async (
	userId: UserId,
	status: Status,
): Promise<number> => {
	"use cache";
	cacheTag(buildCountCacheTag("books", status, userId));
	return await booksQueryRepository.count(userId, status);
};

/**
 * Fetches paginated unexported books for the current user.
 */
export const getUnexportedBooks: GetPaginatedData<ImageCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getBooks(currentCount, userId, makeUnexportedStatus());
	});

/**
 * Fetches paginated exported books for the current user.
 */
export const getExportedBooks: GetPaginatedData<ImageCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getBooks(currentCount, userId, makeExportedStatus().status);
	});

/**
 * Gets the total count of exported books for the current user.
 */
export const getExportedBooksCount: GetCount = cache(
	async (): Promise<number> => {
		const userId = await getSelfId();
		return await _getBooksCount(userId, makeExportedStatus().status);
	},
);

/**
 * Fetches a single book by its ISBN.
 *
 * @param isbn - ISBN to search for
 * @returns Book data or null if not found
 */
export const getBookByISBN = cache(async (isbn: string) => {
	const userId = await getSelfId();
	return await booksQueryRepository.findByISBN(makeISBN(isbn), userId);
});

/**
 * Retrieves book cover image from MinIO storage.
 *
 * @param path - The storage path for the image
 * @param isThumbnail - Whether to retrieve the thumbnail or original image
 * @returns A readable stream of the image data
 */
export const getBooksImageFromStorage = async (
	path: string,
	isThumbnail: boolean,
) => {
	return await booksStorageService.getImage(path, isThumbnail);
};
