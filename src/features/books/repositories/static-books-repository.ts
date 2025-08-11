import { cache } from "react";
import type { StaticBooks } from "@/generated";
import prisma from "@/prisma";

export type IStaticBooksRepository = {
	findAll(): Promise<StaticBooksForDisplay[]>;
	count(): Promise<number>;
};

type StaticBooksForDisplay = {
	title: string;
	href: string;
	image: string;
};

export class StaticBooksRepository implements IStaticBooksRepository {
	private _findAll = async (): Promise<StaticBooksForDisplay[]> => {
		const books = await prisma.staticBooks.findMany({
			select: { ISBN: true, title: true, googleImgSrc: true },
			cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
		});

		return books.map((book) => ({
			title: book.title,
			href: book.ISBN,
			image: book.googleImgSrc || "",
		}));
	};

	private _count = async (): Promise<number> => {
		return await prisma.staticBooks.count({});
	};

	findAll = cache(this._findAll);
	count = cache(this._count);
}

export const staticBooksRepository = new StaticBooksRepository();
