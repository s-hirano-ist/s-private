import type { Status } from "@/generated";
import prisma from "@/prisma";

type IBooksCommandRepository = {
	create(data: BooksCreateInput): Promise<Books>;
	deleteById(ISBN: string, userId: string, status: Status): Promise<void>;
	transaction<T>(fn: () => Promise<T>): Promise<T>;
};

type BooksCreateInput = {
	ISBN: string;
	title: string;
	userId: string;
};

type Books = {
	ISBN: string;
	title: string;
	googleTitle: string;
	googleSubTitle: string;
	googleAuthors: string[];
	googleDescription: string;
	googleImgSrc: string;
	googleHref: string;
	markdown: string;
};

class BooksCommandRepository implements IBooksCommandRepository {
	async create(data: BooksCreateInput): Promise<Books> {
		return await prisma.books.create({
			data: {
				...data,
				googleTitle: "",
				googleSubTitle: "",
				googleAuthors: [],
				googleDescription: "",
				googleImgSrc: "",
				googleHref: "",
				markdown: "",
			},
		});
	}

	async deleteById(
		ISBN: string,
		userId: string,
		status: Status,
	): Promise<void> {
		await prisma.books.delete({
			where: { ISBN_userId: { ISBN, userId }, status },
		});
	}

	async transaction<T>(fn: () => Promise<T>): Promise<T> {
		return await prisma.$transaction(fn);
	}
}

export const booksCommandRepository = new BooksCommandRepository();
