import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import type { GetCount, GetPaginatedData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { ImageCardStackInitialData } from "@/components/common/layouts/cards/types";
import { makeISBN } from "@/domains/books/entities/books-entity";
import type { CacheStrategy } from "@/domains/books/types";
import {
	makeStatus,
	type Status,
	type UserId,
} from "@/domains/common/entities/common-entity";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";

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
				image: d.googleImgSrc,
			})),
			totalCount,
		};
	} catch (error) {
		throw error;
	}
};

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

export const getUnexportedBooks: GetPaginatedData<ImageCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getBooks(currentCount, userId, makeStatus("UNEXPORTED"));
	});

export const getExportedBooks: GetPaginatedData<ImageCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getBooks(currentCount, userId, makeStatus("EXPORTED"), {
			ttl: 400,
			swr: 40,
			tags: [`${sanitizeCacheTag(userId)}_books_${currentCount}`],
		});
	});

export const getExportedBooksCount: GetCount = cache(
	async (): Promise<number> => {
		const userId = await getSelfId();
		return await _getBooksCount(userId, makeStatus("EXPORTED"));
	},
);

export const getBookByISBN = cache(async (isbn: string) => {
	try {
		const userId = await getSelfId();
		return await booksQueryRepository.findByISBN(makeISBN(isbn), userId);
	} catch (error) {
		throw error;
	}
});
