import { Status } from "@/domains/common/types";
import prisma from "@/prisma";

type IBooksCommandRepository = {
	create(data: BooksCreateInput): Promise<Books>;
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
}

export const booksCommandRepository = new BooksCommandRepository();
