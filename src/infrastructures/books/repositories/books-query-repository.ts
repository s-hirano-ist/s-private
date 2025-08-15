import { BooksQueryData } from "@/domains/books/entities/books-entity";
import type {
	BooksFindManyParams,
	IBooksQueryRepository,
} from "@/domains/books/types";
import type { Status } from "@/generated";
import prisma from "@/prisma";

class BooksQueryRepository implements IBooksQueryRepository {
	async findByISBN(
		ISBN: string,
		userId: string,
	): Promise<BooksQueryData | null> {
		const result = await prisma.books.findUnique({
			where: { ISBN_userId: { ISBN, userId } },
		});
		return result;
	}

	async findMany(
		userId: string,
		status: Status,
		params?: BooksFindManyParams,
	): Promise<BooksQueryData[]> {
		return await prisma.books.findMany({
			where: { userId, status },
			select: { id: true, ISBN: true, title: true, googleImgSrc: true },
			...params,
		});
	}

	async count(userId: string, status: Status): Promise<number> {
		return await prisma.books.count({ where: { userId, status } });
	}
}

export const booksQueryRepository = new BooksQueryRepository();
