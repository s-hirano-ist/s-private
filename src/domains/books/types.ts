import { PrismaCacheStrategy } from "@prisma/extension-accelerate";
import type { Prisma, Status } from "@/generated";
import { BooksFormSchema, BooksQueryData } from "./entities/books-entity";

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
	orderBy?: Prisma.BooksOrderByWithRelationInput;
	take?: number;
	skip?: number;
	cacheStrategy?: PrismaCacheStrategy["cacheStrategy"];
};
