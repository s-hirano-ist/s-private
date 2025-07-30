import { cache } from "react";
import db from "@/db";
import { staticBooks } from "@/db/schema";
import { count } from "drizzle-orm";

const _getAllStaticBooks = async () => {
	const books = await db
		.select({
			ISBN: staticBooks.ISBN,
			title: staticBooks.title,
			uint8ArrayImage: staticBooks.uint8ArrayImage,
		})
		.from(staticBooks);
	return books.map((book) => ({
		title: book.title,
		href: book.ISBN,
		uint8ArrayImage: book.uint8ArrayImage,
	}));
};

export const getAllStaticBooks = cache(_getAllStaticBooks);

const _getStaticBooksCount = async () => {
	const [result] = await db
		.select({ count: count() })
		.from(staticBooks);
	return result.count;
};

export const getStaticBooksCount = cache(_getStaticBooksCount);
