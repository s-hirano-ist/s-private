import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import { ImageCardData } from "@/components/common/layouts/cards/image-card";
import type { Status } from "@/domains/common/entities/common-entity";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";

const _getExportedBooks = async (): Promise<ImageCardData[]> => {
	try {
		const userId = await getSelfId();
		const books = await booksQueryRepository.findMany(userId, "EXPORTED", {
			orderBy: { createdAt: "desc" },
			cacheStrategy: { ttl: 400, swr: 40, tags: ["books"] },
		});

		return books.map((d) => ({
			id: d.id,
			title: d.title,
			href: d.ISBN,
			image: d.googleImgSrc ?? "/not-found.png",
		}));
	} catch (error) {
		throw error;
	}
};

export const getExportedBooks = unstable_cache(
	_getExportedBooks,
	["books-exported"],
	{ tags: ["books-exported"], revalidate: 400 },
);

const _getUnexportedBooks = async (): Promise<ImageCardData[]> => {
	try {
		const userId = await getSelfId();
		const books = await booksQueryRepository.findMany(userId, "UNEXPORTED", {
			orderBy: { createdAt: "desc" },
		});

		return books.map((d) => ({
			id: d.id,
			title: d.title,
			href: d.ISBN,
			image: d.googleImgSrc ?? "/not-found.png",
		}));
	} catch (error) {
		throw error;
	}
};

export const getUnexportedBooks = unstable_cache(
	_getUnexportedBooks,
	["books-unexported"],
	{ tags: ["books-unexported"], revalidate: 300 },
);

const _getBooksCount = async (
	status: Status,
): Promise<{ count: number; pageSize: number }> => {
	try {
		const userId = await getSelfId();
		return {
			count: await booksQueryRepository.count(userId, status),
			pageSize: PAGE_SIZE,
		};
	} catch (error) {
		throw error;
	}
};

export const getBooksCount = (status: Status) =>
	unstable_cache(() => _getBooksCount(status), [`books-count-${status}`], {
		tags: [`books-count-${status}`],
		revalidate: 60,
	})();

export const getBookByISBN = cache(async (isbn: string) => {
	try {
		const userId = await getSelfId();
		return await booksQueryRepository.findByISBN(isbn, userId);
	} catch (error) {
		throw error;
	}
});
