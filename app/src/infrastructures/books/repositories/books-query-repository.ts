import {
	type BookListItemDTO,
	type BookSearchItemDTO,
	type ExportedBook,
	type ISBN,
	makeBookMarkdown,
	makeBookTitle,
	makeGoogleAuthors,
	makeGoogleDescription,
	makeGoogleHref,
	makeGoogleImgSrc,
	makeGoogleSubTitle,
	makeGoogleTitle,
	makeISBN,
	type UnexportedBook,
} from "@s-hirano-ist/s-core/books/entities/books-entity";
import type { IBooksQueryRepository } from "@s-hirano-ist/s-core/books/repositories/books-query-repository.interface";
import type { BooksFindManyParams } from "@s-hirano-ist/s-core/books/types/query-params";
import {
	makeCreatedAt,
	makeExportedAt,
	makeId,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { makePath } from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
import { env } from "@/env";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { ORIGINAL_BOOK_IMAGE_PATH, THUMBNAIL_BOOK_IMAGE_PATH } from "./common";

async function findByISBN(
	ISBN: ISBN,
	userId: UserId,
): Promise<UnexportedBook | ExportedBook | null> {
	const data = await prisma.book.findUnique({
		where: { ISBN_userId: { ISBN, userId } },
		select: {
			id: true,
			userId: true,
			ISBN: true,
			title: true,
			googleTitle: true,
			googleSubTitle: true,
			googleAuthors: true,
			googleDescription: true,
			googleImgSrc: true,
			googleHref: true,
			imagePath: true,
			markdown: true,
			status: true,
			createdAt: true,
			exportedAt: true,
		},
	});
	if (!data) return null;

	const base = {
		id: makeId(data.id),
		userId: makeUserId(data.userId),
		ISBN: makeISBN(data.ISBN),
		title: makeBookTitle(data.title),
		googleTitle: data.googleTitle
			? makeGoogleTitle(data.googleTitle)
			: undefined,
		googleSubTitle: data.googleSubTitle
			? makeGoogleSubTitle(data.googleSubTitle)
			: undefined,
		googleAuthors:
			data.googleAuthors.length > 0
				? makeGoogleAuthors(data.googleAuthors)
				: undefined,
		googleDescription: data.googleDescription
			? makeGoogleDescription(data.googleDescription)
			: undefined,
		googleImgSrc: data.googleImgSrc
			? makeGoogleImgSrc(data.googleImgSrc)
			: undefined,
		googleHref: data.googleHref ? makeGoogleHref(data.googleHref) : undefined,
		imagePath: data.imagePath ? makePath(data.imagePath, false) : undefined,
		markdown: data.markdown ? makeBookMarkdown(data.markdown) : undefined,
		createdAt: makeCreatedAt(data.createdAt),
	};

	if (data.status === "EXPORTED" && data.exportedAt) {
		return Object.freeze({
			...base,
			status: "EXPORTED" as const,
			exportedAt: makeExportedAt(data.exportedAt),
		});
	}
	return Object.freeze({ ...base, status: "UNEXPORTED" as const });
}

async function findMany(
	userId: UserId,
	status: Status,
	params?: BooksFindManyParams,
): Promise<BookListItemDTO[]> {
	const data = await prisma.book.findMany({
		where: { userId, status },
		select: {
			id: true,
			ISBN: true,
			title: true,
			googleImgSrc: true,
			imagePath: true,
		},
		...params,
	});
	return data.map((d) => ({
		id: makeId(d.id),
		ISBN: makeISBN(d.ISBN),
		title: makeBookTitle(d.title),
		googleImgSrc: d.googleImgSrc ? makeGoogleImgSrc(d.googleImgSrc) : undefined,
		imagePath: d.imagePath ? makePath(d.imagePath, false) : undefined,
	}));
}

async function count(userId: UserId, status: Status): Promise<number> {
	const data = await prisma.book.count({ where: { userId, status } });
	return data;
}

async function search(
	query: string,
	userId: UserId,
	limit = 20,
): Promise<BookSearchItemDTO[]> {
	const data = await prisma.book.findMany({
		where: {
			userId,
			status: "EXPORTED",
			OR: [
				{ title: { contains: query, mode: "insensitive" } },
				{ markdown: { contains: query, mode: "insensitive" } },
				{ googleTitle: { contains: query, mode: "insensitive" } },
				{ googleSubTitle: { contains: query, mode: "insensitive" } },
				{ googleDescription: { contains: query, mode: "insensitive" } },
				{ googleAuthors: { hasSome: [query] } },
				{ tags: { hasSome: [query] } },
			],
		},
		select: {
			id: true,
			ISBN: true,
			title: true,
			googleTitle: true,
			googleSubTitle: true,
			googleAuthors: true,
			googleDescription: true,
			markdown: true,
			rating: true,
			tags: true,
		},
		take: limit,
		orderBy: { createdAt: "desc" },
	});
	return data.map((d) => ({
		id: makeId(d.id),
		ISBN: makeISBN(d.ISBN),
		title: makeBookTitle(d.title),
		googleTitle: d.googleTitle ? makeGoogleTitle(d.googleTitle) : undefined,
		googleSubTitle: d.googleSubTitle
			? makeGoogleSubTitle(d.googleSubTitle)
			: undefined,
		googleAuthors:
			d.googleAuthors.length > 0
				? makeGoogleAuthors(d.googleAuthors)
				: undefined,
		googleDescription: d.googleDescription
			? makeGoogleDescription(d.googleDescription)
			: undefined,
		markdown: d.markdown ? makeBookMarkdown(d.markdown) : undefined,
		rating: d.rating,
		tags: d.tags,
	}));
}

async function getImageFromStorage(
	path: string,
	isThumbnail: boolean,
): Promise<NodeJS.ReadableStream> {
	const objKey = `${isThumbnail ? THUMBNAIL_BOOK_IMAGE_PATH : ORIGINAL_BOOK_IMAGE_PATH}/${path}`;
	const data = await minioClient.getObject(env.MINIO_BUCKET_NAME, objKey);
	return data;
}

export const booksQueryRepository: IBooksQueryRepository = {
	findByISBN,
	findMany,
	count,
	search,
	getImageFromStorage,
};
