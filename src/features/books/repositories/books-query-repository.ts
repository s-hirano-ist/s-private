import { PrismaCacheStrategy } from "@prisma/extension-accelerate";
import type { Prisma, Status } from "@/generated";
import prisma from "@/prisma";

type IBooksQueryRepository = {
	findByISBN(
		isbn: string,
		userId: string,
		status: Status,
	): Promise<Books | null>;
	findMany(
		userId: string,
		status: Status,
		params?: BooksFindManyParams,
	): Promise<BooksList>;
	count(userId: string, status: Status): Promise<number>;
};

type Books = {
	title: string;
	ISBN: string;
	googleImgSrc: string;
	markdown: string;
	googleTitle: string;
	googleHref: string;
	googleAuthors: string[];
	googleDescription: string;
	googleSubTitle: string;
};

type BooksList = {
	title: string;
	ISBN: string;
	googleImgSrc: string;
}[];

type BooksFindManyParams = {
	orderBy?: Prisma.BooksOrderByWithRelationInput;
	take?: number;
	skip?: number;
	cacheStrategy?: PrismaCacheStrategy["cacheStrategy"];
};

class BooksQueryRepository implements IBooksQueryRepository {
	findByISBN = async (
		ISBN: string,
		userId: string,
		status: Status,
	): Promise<Books | null> => {
		return await prisma.books.findUnique({
			where: { ISBN, userId, status },
			select: {
				title: true,
				ISBN: true,
				googleImgSrc: true,
				markdown: true,
				googleTitle: true,
				googleHref: true,
				googleAuthors: true,
				googleDescription: true,
				googleSubTitle: true,
			},
		});
	};

	findMany = async (
		userId: string,
		status: Status,
		params?: BooksFindManyParams,
	): Promise<BooksList> => {
		return await prisma.books.findMany({
			where: { userId, status },
			select: { ISBN: true, title: true, googleImgSrc: true },
			...params,
		});
	};

	async count(userId: string, status: Status): Promise<number> {
		return await prisma.books.count({ where: { userId, status } });
	}
}

export const booksQueryRepository = new BooksQueryRepository();
