import prisma from "@/prisma";
import { cache } from "react";

const _getAllStaticBooks = async () => {
	return await prisma.staticBooks.findMany({
		select: { title: true, uint8ArrayImage: true },
		cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
	});
};

export const getAllStaticBooks = cache(_getAllStaticBooks);

const _getStaticBooksCount = async () => {
	return await prisma.staticBooks.count({});
};

export const getStaticBooksCount = cache(_getStaticBooksCount);
