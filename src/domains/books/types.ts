import { z } from "zod";
import { DomainError, Result } from "@/domains/common/value-objects";
import type {
	BookAggregate,
	BookId,
	BookStatus,
	UserId,
} from "./entities/books-entity";
import type { BookTags, BookTitle, ISBN, Rating } from "./value-objects";

// Functional repository interfaces
export type IBooksCommandRepository = {
	save(book: BookAggregate): Promise<Result<void, DomainError>>;
	delete(
		id: BookId,
		userId: UserId,
		status: BookStatus,
	): Promise<Result<void, DomainError>>;
};

export type IBooksQueryRepository = {
	findById(
		id: BookId,
		userId: UserId,
	): Promise<Result<BookAggregate | null, DomainError>>;
	findByISBN(
		isbn: ISBN,
		userId: UserId,
	): Promise<Result<BookAggregate | null, DomainError>>;
	findMany(
		userId: UserId,
		status: BookStatus,
		params?: BooksFindManyParams,
	): Promise<Result<BookAggregate[], DomainError>>;
	count(
		userId: UserId,
		status: BookStatus,
	): Promise<Result<number, DomainError>>;
};

// Query parameters with functional types
export type SortOrder = "asc" | "desc";

export type CacheStrategy = {
	ttl?: number;
	swr?: number;
	tags?: string[];
};

export type BooksOrderByField = keyof BookAggregate;

export type BooksOrderBy = Partial<Record<BooksOrderByField, SortOrder>>;

export type BooksFindManyParams = {
	orderBy?: BooksOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};

// Domain service dependencies
export type BookDomainDeps = {
	readonly commandRepository: IBooksCommandRepository;
	readonly queryRepository: IBooksQueryRepository;
};

// Command and query types
export type CreateBookCommand = {
	isbn: ISBN;
	title: BookTitle;
	userId: UserId;
	rating?: Rating;
	tags?: BookTags;
	markdown?: string;
};

export type UpdateBookCommand = {
	id: BookId;
	userId: UserId;
	title?: BookTitle;
	rating?: Rating;
	tags?: BookTags;
	markdown?: string;
};

export type DeleteBookCommand = {
	id: BookId;
	userId: UserId;
	status: BookStatus;
};

export type GetBooksQuery = {
	userId: UserId;
	status: BookStatus;
	params?: BooksFindManyParams;
};

export type GetBookByISBNQuery = {
	isbn: ISBN;
	userId: UserId;
};

// Event types for domain events
export type BookDomainEvents = {
	BookCreated: {
		bookId: BookId;
		isbn: ISBN;
		title: BookTitle;
		userId: UserId;
	};
	BookUpdated: {
		bookId: BookId;
		userId: UserId;
		changes: Partial<BookAggregate>;
	};
	BookDeleted: {
		bookId: BookId;
		userId: UserId;
	};
	BookStatusChanged: {
		bookId: BookId;
		userId: UserId;
		oldStatus: BookStatus;
		newStatus: BookStatus;
	};
};
