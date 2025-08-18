import type { Id, Status, UserId } from "../common/entities/common-entity";
import type { Book, ISBN } from "./entities/books-entity";

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
	create(data: Book): Promise<void>;
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};

export type IBooksQueryRepository = {
	findByISBN(
		ISBN: ISBN,
		userId: UserId,
	): Promise<{
		ISBN: string;
		id: string;
		title: string;
		googleTitle: string | null;
		googleSubTitle: string | null;
		googleAuthors: string[];
		googleDescription: string | null;
		googleImgSrc: string | null;
		googleHref: string | null;
		markdown: string | null;
		rating: number | null;
		tags: string[];
		createdAt: Date;
		updatedAt: Date;
		exportedAt: Date | null;
	} | null>;
	findMany(
		userId: string,
		status: Status,
		params?: BooksFindManyParams,
	): Promise<
		{
			ISBN: string;
			id: string;
			title: string;
			googleTitle: string | null;
			googleSubTitle: string | null;
			googleAuthors: string[];
			googleDescription: string | null;
			googleImgSrc: string | null;
			googleHref: string | null;
			markdown: string | null;
			rating: number | null;
			tags: string[];
			createdAt: Date;
			updatedAt: Date;
			exportedAt: Date | null;
		}[]
	>;
	count(userId: UserId, status: Status): Promise<number>;
};

export type BooksFindManyParams = {
	orderBy?: BooksOrderBy;
	take?: number;
	skip?: number;
	cacheStrategy?: CacheStrategy;
};
