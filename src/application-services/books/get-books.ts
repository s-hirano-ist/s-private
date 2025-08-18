import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import { ImageCardStackInitialData } from "@/components/common/layouts/cards/image-card-stack";
import type { BookStatus, UserId } from "@/domains/books/entities/books-entity";
import type { CacheStrategy } from "@/domains/books/types";
import { BookTitle, ISBN } from "@/domains/books/value-objects";
import { Result } from "@/domains/common/value-objects";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";

// Functional approach to getting books
export const _getBooks = async (
	currentCount: number,
	userId: UserId,
	status: BookStatus,
	cacheStrategy?: CacheStrategy,
): Promise<ImageCardStackInitialData> => {
	"use cache";
	cacheTag(
		`books_${status}_${userId}`,
		`books_${status}_${userId}_${currentCount}`,
	);

	const booksResult = await booksQueryRepository.findMany(userId, status, {
		skip: currentCount,
		take: PAGE_SIZE,
		orderBy: { createdAt: "desc" },
		cacheStrategy,
	});

	if (booksResult.isFailure) {
		throw new Error(booksResult.error.message);
	}

	const totalCountResult = await _getBooksCount(userId, status);
	if (totalCountResult.isFailure) {
		throw new Error(totalCountResult.error.message);
	}

	return {
		data: booksResult.value.map((book) => ({
			id: book.id,
			title: BookTitle.unwrap(book.title),
			href: ISBN.unwrap(book.isbn),
			image: book.googleMetadata?.imgSrc ?? "/not-found.png",
		})),
		totalCount: totalCountResult.value,
	};
};

const _getBooksCount = async (
	userId: UserId,
	status: BookStatus,
): Promise<Result<number, Error>> => {
	"use cache";
	cacheTag(`books_count_${status}_${userId}`);

	const countResult = await booksQueryRepository.count(userId, status);
	if (countResult.isFailure) {
		return Result.failure(new Error(countResult.error.message));
	}

	return Result.success(countResult.value);
};

export type GetBooks = (_: number) => Promise<ImageCardStackInitialData>;

export const getUnexportedBooks: GetBooks = cache(
	async (currentCount: number) => {
		const userId = await getSelfId();
		return _getBooks(currentCount, userId, "UNEXPORTED");
	},
);

export const getExportedBooks: GetBooks = cache(
	async (currentCount: number) => {
		const userId = await getSelfId();
		return _getBooks(currentCount, userId, "EXPORTED", {
			ttl: 400,
			swr: 40,
			tags: [`${sanitizeCacheTag(userId)}_books_${currentCount}`],
		});
	},
);

export type GetBooksCount = () => Promise<number>;

export const getUnexportedBooksCount: GetBooksCount = cache(
	async (): Promise<number> => {
		const userId = await getSelfId();
		const result = await _getBooksCount(userId, "UNEXPORTED");
		if (result.isFailure) {
			throw result.error;
		}
		return result.value;
	},
);

export const getExportedBooksCount: GetBooksCount = cache(
	async (): Promise<number> => {
		const userId = await getSelfId();
		const result = await _getBooksCount(userId, "EXPORTED");
		if (result.isFailure) {
			throw result.error;
		}
		return result.value;
	},
);

export const getBookByISBN = cache(async (isbnString: string) => {
	const userId = await getSelfId();

	const isbnResult = ISBN.safeParse(isbnString);
	if (!isbnResult.success) {
		throw new Error("Invalid ISBN format");
	}

	const bookResult = await booksQueryRepository.findByISBN(
		isbnResult.data,
		userId,
	);
	if (bookResult.isFailure) {
		throw new Error(bookResult.error.message);
	}

	return bookResult.value;
});
