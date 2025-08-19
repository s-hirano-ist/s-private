import type { ISBN } from "@/domains/books/entities/books-entity";
import type { IBooksQueryRepository } from "@/domains/books/repositories/books-query-repository.interface";
import type { BooksFindManyParams } from "@/domains/books/types/query-params";
import type { Status, UserId } from "@/domains/common/entities/common-entity";
import prisma from "@/prisma";

class BooksQueryRepository implements IBooksQueryRepository {
	async findByISBN(ISBN: ISBN, userId: UserId) {
		const data = await prisma.book.findUnique({
			where: { ISBN_userId: { ISBN, userId } },
			omit: { userId: true },
		});
		return data;
	}

	async findMany(userId: UserId, status: Status, params?: BooksFindManyParams) {
		const data = await prisma.book.findMany({
			where: { userId, status },
			omit: { userId: true },
			...params,
		});
		return data;
	}

	async count(userId: UserId, status: Status) {
		const data = await prisma.book.count({ where: { userId, status } });
		return data;
	}

	search = async (
		query: string,
		userId: UserId,
		limit = 20,
	): Promise<
		{
			id: string;
			ISBN: string;
			title: string;
			googleTitle: string | null;
			googleSubTitle: string | null;
			googleAuthors: string[];
			googleDescription: string | null;
			markdown: string | null;
			rating: number | null;
			tags: string[];
		}[]
	> => {
		const data = await prisma.book.findMany({
			where: {
				userId,
				status: "EXPORTED",
				OR: [
					{ title: { contains: query, mode: "insensitive" } },
					{ markdown: { contains: query, mode: "insensitive" } },
					{ googleTitle: { contains: query, mode: "insensitive" } },
					{ googleSubTitle: { contains: query, mode: "insensitive" } },
					{ googleDescription: { contains: query, mode: "insensitive" } },
					{ googleAuthors: { hasSome: [query] } },
					{ tags: { hasSome: [query] } },
				],
			},
			select: {
				id: true,
				ISBN: true,
				title: true,
				googleTitle: true,
				googleSubTitle: true,
				googleAuthors: true,
				googleDescription: true,
				markdown: true,
				rating: true,
				tags: true,
			},
			take: limit,
			orderBy: { createdAt: "desc" },
		});
		return data;
	};
}

export const booksQueryRepository = new BooksQueryRepository();
