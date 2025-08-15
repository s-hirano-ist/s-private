import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { ImageCardData } from "@/common/components/card/image-card";
import type { Status } from "@/domains/common/entities/common-entity";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";

export const getExportedBooks = cache(async (): Promise<ImageCardData[]> => {
	const userId = await getSelfId();
	const books = await booksQueryRepository.findMany(userId, "EXPORTED", {
		orderBy: { createdAt: "desc" },
		cacheStrategy: { ttl: 400, swr: 40, tags: ["books"] },
	});

	return books.map((d) => ({
		title: d.title,
		href: d.ISBN,
		image: d.googleImgSrc ?? "/not-found.png",
	}));
});

export const getUnexportedBooks = cache(async (): Promise<ImageCardData[]> => {
	const userId = await getSelfId();
	const books = await booksQueryRepository.findMany(userId, "UNEXPORTED", {
		orderBy: { createdAt: "desc" },
	});

	return books.map((d) => ({
		title: d.title,
		href: d.ISBN,
		image: d.googleImgSrc ?? "/not-found.png",
	}));
});

export const getBooksCount = cache(async (status: Status) => {
	const userId = await getSelfId();
	return await booksQueryRepository.count(userId, status);
});

export const getBookByISBN = cache(async (isbn: string) => {
	const userId = await getSelfId();
	return await booksQueryRepository.findByISBN(isbn, userId);
});
