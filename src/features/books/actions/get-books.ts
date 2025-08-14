import { cache } from "react";
import { ImageCardData } from "@/components/card/image-card";
import { booksQueryRepository } from "@/features/books/repositories/books-query-repository";
import type { Status } from "@/features/types";
import { getSelfId } from "@/utils/auth/session";

export const getExportedBooks = cache(async (): Promise<ImageCardData[]> => {
	const userId = await getSelfId();
	const books = await booksQueryRepository.findMany(userId, "EXPORTED", {
		orderBy: { createdAt: "desc" },
		cacheStrategy: { ttl: 400, swr: 40, tags: ["books"] },
	});

	return books.map((d) => ({
		title: d.title,
		href: d.ISBN,
		image: d.googleImgSrc,
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
		image: d.googleImgSrc !== "" ? d.googleImgSrc : "/not-found.png",
	}));
});

export const getBooksCount = cache(async (status: Status) => {
	const userId = await getSelfId();
	return await booksQueryRepository.count(userId, status);
});

export const getBookByISBN = cache(async (isbn: string) => {
	const userId = await getSelfId();
	return await booksQueryRepository.findByISBN(isbn, userId, "EXPORTED");
});
