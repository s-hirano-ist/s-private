import "server-only";
import type {
	IBooksCommandRepository,
	IBooksQueryRepository,
} from "@/domains/books/types";
import { DomainError, pipe, Result } from "@/domains/common/value-objects";
import {
	type BookAggregate,
	BookEntity,
	type BookId,
	type BookStatus,
	type UserId,
} from "../entities/books-entity";
import { ISBN } from "../value-objects";

// Reader monad pattern for dependency injection
export type BooksDomainServiceDeps = {
	readonly booksQueryRepository: IBooksQueryRepository;
	readonly booksCommandRepository: IBooksCommandRepository;
};

export type BooksDomainServiceReader<T> = (
	deps: BooksDomainServiceDeps,
) => Promise<Result<T, DomainError>>;

// Pure domain functions
export const booksDomainOperations = {
	validateNewBook: async (
		formData: FormData,
		userId: UserId,
		deps: BooksDomainServiceDeps,
	): Promise<Result<BookAggregate, DomainError>> => {
		// Parse form data into domain object
		const bookDataResult = BookEntity.fromFormData(formData, userId);
		if (bookDataResult.isFailure) {
			return bookDataResult;
		}

		// Check for duplicates
		const isbn = bookDataResult.value.isbn;
		const duplicateCheckResult = await checkISBNDuplicate(isbn, userId, deps);
		if (duplicateCheckResult.isFailure) {
			return duplicateCheckResult;
		}

		// Create book entity
		return BookEntity.create(bookDataResult.value);
	},

	updateBookStatus: (
		book: BookAggregate,
		newStatus: "UNEXPORTED" | "EXPORTED",
	): Result<BookAggregate, DomainError> => {
		if (book.status === newStatus) {
			return Result.failure(
				DomainError.businessRule(
					"Book is already in the requested status",
					"status_unchanged",
					{ currentStatus: book.status, requestedStatus: newStatus },
				),
			);
		}

		return Result.success(BookEntity.updateStatus(book, newStatus));
	},

	enrichWithGoogleData: async (
		book: BookAggregate,
		googleData: any,
	): Promise<Result<BookAggregate, DomainError>> => {
		// Google Books API integration logic would go here
		// For now, just return the book unchanged
		return Result.success(book);
	},
};

// Helper functions
const checkISBNDuplicate = async (
	isbn: ISBN,
	userId: UserId,
	deps: BooksDomainServiceDeps,
): Promise<Result<void, DomainError>> => {
	const existingBookResult = await deps.booksQueryRepository.findByISBN(
		isbn,
		userId,
	);

	if (existingBookResult.isFailure) {
		return existingBookResult;
	}

	if (existingBookResult.value !== null) {
		return Result.failure(
			DomainError.duplicate(
				"A book with this ISBN already exists",
				"book",
				ISBN.unwrap(isbn),
			),
		);
	}

	return Result.success(undefined);
};

// Pipeline composition functions
export const bookProcessingPipelines = {
	createNewBook:
		(deps: BooksDomainServiceDeps) =>
		async (
			formData: FormData,
			userId: UserId,
		): Promise<Result<BookAggregate, DomainError>> => {
			return booksDomainOperations.validateNewBook(formData, userId, deps);
		},

	processBookUpdate:
		(deps: BooksDomainServiceDeps) =>
		async (
			bookId: string,
			updateData: Partial<BookAggregate>,
		): Promise<Result<BookAggregate, DomainError>> => {
			// Implementation would fetch existing book and apply updates
			// This is a placeholder for the pattern
			return Result.failure(
				DomainError.businessRule("Not implemented", "not_implemented"),
			);
		},
};

// Legacy class-based service removed - use functional operations directly
