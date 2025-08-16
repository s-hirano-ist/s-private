import { BookEntity } from "@/domains/books/entities/book.entity";
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
	): Promise<BookEntity | null> {
		const result = await prisma.books.findUnique({
			where: { ISBN_userId: { ISBN, userId } },
		});
		
		if (!result) return null;
		
		return BookEntity.reconstitute(result);
	}

	async findMany(
		userId: string,
		status: Status,
		params?: BooksFindManyParams,
	): Promise<BookEntity[]> {
		const results = await prisma.books.findMany({
			where: { userId, status },
			...params,
		});
		
		return results.map(result => BookEntity.reconstitute(result));
	}

	async count(userId: string, status: Status): Promise<number> {
		return await prisma.books.count({ where: { userId, status } });
	}
}

export const booksQueryRepository = new BooksQueryRepository();
