import { cache } from "react";
import prisma from "@/prisma";

const _getAllStaticBooks = async () => {
	const books = await prisma.staticBooks.findMany({
		select: { ISBN: true, title: true, googleImgSrc: true },
		cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
	});
	return books.map((book) => ({
		title: book.title,
		href: book.ISBN,
		image: book.googleImgSrc,
	}));
};

export const getAllStaticBooks = cache(_getAllStaticBooks);

const _getStaticBooksCount = async () => {
	return await prisma.staticBooks.count({});
};

export const getStaticBooksCount = cache(_getStaticBooksCount);
