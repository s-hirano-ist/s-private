import {
	type BooksQueryData,
	booksQueryData,
} from "@/domains/books/entities/books-entity";
import type {
	BooksFindManyParams,
	IBooksQueryRepository,
} from "@/domains/books/types";
import type { Status } from "@/domains/common/entities/common-entity";
import prisma from "@/prisma";

class BooksQueryRepository implements IBooksQueryRepository {
	async findByISBN(
		ISBN: string,
		userId: string,
	): Promise<BooksQueryData | null> {
		const result = await prisma.books.findUnique({
			where: { ISBN_userId: { ISBN, userId } },
		});
		if (!result) return null;

		// Transform Prisma result to match BooksQueryData schema (omits userId and status)
		return booksQueryData.parse(result);
	}

	async findMany(
		userId: string,
		status: Status,
		params?: BooksFindManyParams,
	): Promise<BooksQueryData[]> {
		const results = await prisma.books.findMany({
			where: { userId, status },
			...params,
		});

		// Transform Prisma results to match BooksQueryData schema (omits userId and status)
		return results.map((result) => booksQueryData.parse(result));
	}

	async count(userId: string, status: Status): Promise<number> {
		return await prisma.books.count({ where: { userId, status } });
	}
}

export const booksQueryRepository = new BooksQueryRepository();
