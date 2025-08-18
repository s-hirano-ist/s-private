import type { Status } from "../common/entities/common-entity";
import type { BooksFormSchema, BooksQueryData } from "./entities/books-entity";

// Custom types to avoid Prisma dependency in domain layer
export type SortOrder = "asc" | "desc";

export type CacheStrategy = {
	ttl?: number;
	swr?: number;
	tags?: string[];
};

export type BooksOrderByField =
	| "id"
	| "ISBN"
	| "title"
	| "googleTitle"
	| "googleSubTitle"
	| "googleAuthors"
	| "googleDescription"
	| "googleImgSrc"
	| "googleHref"
	| "markdown"
	| "rating"
	| "tags"
	| "status"
	| "createdAt"
	| "updatedAt"
	| "exportedAt";

export type BooksOrderBy = {
	[K in BooksOrderByField]?: SortOrder;
};

export type IBooksCommandRepository = {
	create(data: BooksFormSchema): Promise<void>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};

export type IBooksQueryRepository = {
	findByISBN(ISBN: string, userId: string): Promise<BooksQueryData | null>;
	findMany(
		userId: string,
		status: Status,
		params?: BooksFindManyParams,
	): Promise<BooksQueryData[]>;
	count(userId: string, status: Status): Promise<number>;
};

export type BooksFindManyParams = {
	orderBy?: BooksOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};
