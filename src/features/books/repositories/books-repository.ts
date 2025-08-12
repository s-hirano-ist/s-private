import type { Books } from "@/generated";
import prisma from "@/prisma";

export type IBooksRepository = {
	findAll(): Promise<BooksForDisplay[]>;
	findByISBN(isbn: string): Promise<Books | null>;
	count(): Promise<number>;
};

type BooksForDisplay = {
	title: string;
	href: string;
	image: string;
};

export class BooksRepository implements IBooksRepository {
	findAll = async (): Promise<BooksForDisplay[]> => {
		const books = await prisma.books.findMany({
			select: { ISBN: true, title: true, googleImgSrc: true },
			cacheStrategy: { ttl: 400, tags: ["books"] },
		});

		return books.map((book) => ({
			title: book.title,
			href: book.ISBN,
			image: book.googleImgSrc || "",
		}));
	};

	findByISBN = async (isbn: string): Promise<Books | null> => {
		return await prisma.books.findUnique({
			where: { ISBN: isbn },
			cacheStrategy: { ttl: 400, tags: ["books"] },
		});
	};

	count = async (): Promise<number> => {
		return await prisma.books.count({});
	};
}

export const booksRepository = new BooksRepository();
