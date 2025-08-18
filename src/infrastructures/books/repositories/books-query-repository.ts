import type { ISBN } from "@/domains/books/entities/books-entity";
import type { IBooksQueryRepository } from "@/domains/books/repositories/books-query-repository.interface";
import type { BooksFindManyParams } from "@/domains/books/types/query-params";
import type { Status, UserId } from "@/domains/common/entities/common-entity";
import prisma from "@/prisma";

class BooksQueryRepository implements IBooksQueryRepository {
	async findByISBN(ISBN: ISBN, userId: UserId) {
		return await prisma.books.findUnique({
			where: { ISBN_userId: { ISBN, userId } },
			omit: { userId: true },
		});
	}

	async findMany(userId: UserId, status: Status, params?: BooksFindManyParams) {
		return await prisma.books.findMany({
			where: { userId, status },
			omit: { userId: true },
			...params,
		});
	}

	async count(userId: UserId, status: Status) {
		return await prisma.books.count({ where: { userId, status } });
	}
}

export const booksQueryRepository = new BooksQueryRepository();
