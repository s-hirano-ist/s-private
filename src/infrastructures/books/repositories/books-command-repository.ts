import type {
	BookAggregate,
	BookId,
	BookStatus,
	UserId,
} from "@/domains/books/entities/books-entity";
import type { IBooksCommandRepository } from "@/domains/books/types";
import { BookTitle, ISBN } from "@/domains/books/value-objects";
import { DomainError, Result } from "@/domains/common/value-objects";
import { serverLogger } from "@/infrastructures/observability/server";
import prisma from "@/prisma";

// Functional repository implementation
const save = async (
	book: BookAggregate,
): Promise<Result<void, DomainError>> => {
	try {
		// Convert domain model to Prisma format
		const prismaData = {
			id: book.id,
			ISBN: ISBN.unwrap(book.isbn),
			title: BookTitle.unwrap(book.title),
			userId: book.userId,
			status: book.status,
			rating: book.rating ? (book.rating as any) : null,
			tags: book.tags ? (book.tags as any) : [],
			markdown: book.markdown || null,
			googleTitle: book.googleMetadata?.title || null,
			googleSubTitle: book.googleMetadata?.subTitle || null,
			googleAuthors: book.googleMetadata?.authors || null,
			googleDescription: book.googleMetadata?.description || null,
			googleImgSrc: book.googleMetadata?.imgSrc || null,
			googleHref: book.googleMetadata?.href || null,
		};

		// Use upsert to handle both create and update
		const response = await prisma.books.upsert({
			where: { id: book.id },
			create: prismaData,
			update: {
				...prismaData,
				updatedAt: new Date(),
			},
		});

		serverLogger.info(
			`【BOOKS】\n\nコンテンツ\nISBN: ${response.ISBN} \ntitle: ${response.title}\nの保存ができました`,
			{ caller: "saveBook", status: 201, userId: response.userId },
			{ notify: true },
		);

		return Result.success(undefined);
	} catch (error) {
		serverLogger.error(
			"Failed to save book",
			{ caller: "saveBook", status: 500 },
			error,
			{ notify: true },
		);
		return Result.failure(
			DomainError.businessRule(
				"Failed to save book to database",
				"database_save_failed",
				{
					bookId: book.id,
					error: error instanceof Error ? error.message : "Unknown error",
				},
			),
		);
	}
};

const deleteBook = async (
	id: BookId,
	userId: UserId,
	status: BookStatus,
): Promise<Result<void, DomainError>> => {
	try {
		const data = await prisma.books.delete({
			where: { id, userId, status },
			select: { title: true },
		});

		serverLogger.info(
			`【BOOKS】\n\n削除\ntitle: ${data.title}`,
			{ caller: "deleteBook", status: 200, userId },
			{ notify: true },
		);

		return Result.success(undefined);
	} catch (error) {
		serverLogger.error(
			"Failed to delete book",
			{ caller: "deleteBook", status: 500 },
			error,
			{ notify: true },
		);
		return Result.failure(
			DomainError.businessRule(
				"Failed to delete book from database",
				"database_delete_failed",
				{
					bookId: id,
					error: error instanceof Error ? error.message : "Unknown error",
				},
			),
		);
	}
};

// Functional repository object
export const booksCommandRepository: IBooksCommandRepository = {
	save,
	delete: deleteBook,
};
