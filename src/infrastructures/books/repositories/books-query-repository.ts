import type {
	BookAggregate,
	BookId,
	BookStatus,
	UserId,
} from "@/domains/books/entities/books-entity";
import type {
	BooksFindManyParams,
	IBooksQueryRepository,
} from "@/domains/books/types";
import {
	BookTags,
	BookTitle,
	ISBN,
	Rating,
} from "@/domains/books/value-objects";
import { DomainError, Result } from "@/domains/common/value-objects";
import prisma from "@/prisma";

// Functional mapper from Prisma to Domain
const mapPrismaToBookAggregate = (
	prismaBook: any,
): Result<BookAggregate, DomainError> => {
	try {
		const isbnResult = ISBN.safeParse(prismaBook.ISBN);
		const titleResult = BookTitle.safeParse(prismaBook.title);

		if (!isbnResult.success) {
			return Result.failure(
				DomainError.validation("Invalid ISBN in database", "isbn"),
			);
		}

		if (!titleResult.success) {
			return Result.failure(
				DomainError.validation("Invalid title in database", "title"),
			);
		}

		const rating = prismaBook.rating
			? Rating.safeParse(prismaBook.rating).data
			: null;
		const tags = prismaBook.tags
			? BookTags.safeParse(prismaBook.tags).data || []
			: [];

		const googleMetadata = {
			title: prismaBook.googleTitle,
			subTitle: prismaBook.googleSubTitle,
			authors: prismaBook.googleAuthors,
			description: prismaBook.googleDescription,
			imgSrc: prismaBook.googleImgSrc,
			href: prismaBook.googleHref,
		};

		const bookAggregate: BookAggregate = {
			id: prismaBook.id,
			isbn: isbnResult.data,
			title: titleResult.data,
			userId: prismaBook.userId,
			status: prismaBook.status,
			rating,
			tags,
			markdown: prismaBook.markdown,
			googleMetadata: Object.values(googleMetadata).some((v) => v !== null)
				? googleMetadata
				: undefined,
			createdAt: prismaBook.createdAt,
			updatedAt: prismaBook.updatedAt,
			exportedAt: prismaBook.exportedAt,
		};

		return Result.success(bookAggregate);
	} catch (error) {
		return Result.failure(
			DomainError.businessRule(
				"Failed to map book from database",
				"mapping_error",
				{ error: error instanceof Error ? error.message : "Unknown error" },
			),
		);
	}
};

// Query functions
const findById = async (
	id: BookId,
	userId: UserId,
): Promise<Result<BookAggregate | null, DomainError>> => {
	try {
		const result = await prisma.books.findFirst({
			where: { id, userId },
		});

		if (!result) {
			return Result.success(null);
		}

		return mapPrismaToBookAggregate(result);
	} catch (error) {
		return Result.failure(
			DomainError.businessRule(
				"Failed to find book by ID",
				"database_query_failed",
				{
					bookId: id,
					error: error instanceof Error ? error.message : "Unknown error",
				},
			),
		);
	}
};

const findByISBN = async (
	isbn: ISBN,
	userId: UserId,
): Promise<Result<BookAggregate | null, DomainError>> => {
	try {
		const result = await prisma.books.findUnique({
			where: { ISBN_userId: { ISBN: ISBN.unwrap(isbn), userId } },
		});

		if (!result) {
			return Result.success(null);
		}

		return mapPrismaToBookAggregate(result);
	} catch (error) {
		return Result.failure(
			DomainError.businessRule(
				"Failed to find book by ISBN",
				"database_query_failed",
				{
					isbn: ISBN.unwrap(isbn),
					error: error instanceof Error ? error.message : "Unknown error",
				},
			),
		);
	}
};

const findMany = async (
	userId: UserId,
	status: BookStatus,
	params?: BooksFindManyParams,
): Promise<Result<BookAggregate[], DomainError>> => {
	try {
		const results = await prisma.books.findMany({
			where: { userId, status },
			...params,
		});

		const books: BookAggregate[] = [];
		for (const result of results) {
			const bookResult = mapPrismaToBookAggregate(result);
			if (bookResult.isFailure) {
				return bookResult;
			}
			books.push(bookResult.value);
		}

		return Result.success(books);
	} catch (error) {
		return Result.failure(
			DomainError.businessRule(
				"Failed to find books",
				"database_query_failed",
				{ error: error instanceof Error ? error.message : "Unknown error" },
			),
		);
	}
};

const count = async (
	userId: UserId,
	status: BookStatus,
): Promise<Result<number, DomainError>> => {
	try {
		const result = await prisma.books.count({ where: { userId, status } });
		return Result.success(result);
	} catch (error) {
		return Result.failure(
			DomainError.businessRule(
				"Failed to count books",
				"database_query_failed",
				{ error: error instanceof Error ? error.message : "Unknown error" },
			),
		);
	}
};

// Functional repository object
export const booksQueryRepository: IBooksQueryRepository = {
	findById,
	findByISBN,
	findMany,
	count,
};
