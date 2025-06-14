import prisma from "@/prisma";
import { cache } from "react";

const _getAllStaticBooks = async () => {
	const books = await prisma.staticBooks.findMany({
		select: { ISBN: true, title: true, uint8ArrayImage: true },
		cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
	});
	return books.map((book) => ({
		title: book.title,
		href: book.ISBN,
		uint8ArrayImage: book.uint8ArrayImage,
	}));
};

export const getAllStaticBooks = cache(_getAllStaticBooks);

const _getStaticBooksCount = async () => {
	return await prisma.staticBooks.count({});
};

export const getStaticBooksCount = cache(_getStaticBooksCount);
