/**
 * Book query application services.
 *
 * @remarks
 * Provides cached data access for books with pagination support.
 * Books are identified by ISBN and include Google Books metadata.
 *
 * @module
 */

import { makeISBN } from "@s-hirano-ist/s-core/books/entities/books-entity";
import type { CacheStrategy } from "@s-hirano-ist/s-core/books/types/cache-strategy";
import {
	makeExportedStatus,
	makeUnexportedStatus,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import type { GetCount, GetPaginatedData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { ImageCardStackInitialData } from "@/components/common/layouts/cards/types";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";

const API_BOOK_THUMBNAIL_PATH = "/api/books/images/thumbnail";

/**
 * Fetches paginated books with cache support.
 *
 * @internal
 */
export const _getBooks = async (
	currentCount: number,
	userId: UserId,
	status: Status,
	cacheStrategy?: CacheStrategy,
): Promise<ImageCardStackInitialData> => {
	"use cache";
	cacheTag(
		`books_${status}_${userId}`,
		`books_${status}_${userId}_${currentCount}`,
	);

	try {
		const books = await booksQueryRepository.findMany(userId, status, {
			skip: currentCount,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
			cacheStrategy,
		});

		const totalCount = await _getBooksCount(userId, status);

		return {
			data: books.map((d) => ({
				id: d.id,
				title: d.title,
				href: d.ISBN,
				image: d.imagePath
					? `${API_BOOK_THUMBNAIL_PATH}/${d.imagePath}`
					: (d.googleImgSrc ?? null),
			})),
			totalCount,
		};
	} catch (error) {
		throw error;
	}
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
	cacheTag(`books_count_${status}_${userId}`);
	try {
		return await booksQueryRepository.count(userId, status);
	} catch (error) {
		throw error;
	}
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
 *
 * @remarks
 * Uses Prisma Accelerate caching for viewer performance.
 */
export const getExportedBooks: GetPaginatedData<ImageCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getBooks(currentCount, userId, makeExportedStatus().status, {
			ttl: 400,
			swr: 40,
			tags: [`${sanitizeCacheTag(userId)}_books_${currentCount}`],
		});
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
	try {
		const userId = await getSelfId();
		return await booksQueryRepository.findByISBN(makeISBN(isbn), userId);
	} catch (error) {
		throw error;
	}
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
	return await booksQueryRepository.getImageFromStorage(path, isThumbnail);
};
