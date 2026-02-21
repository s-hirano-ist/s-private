import {
	type BookListItemDTO,
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
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import type {
	BooksFindManyParams,
	IBooksQueryRepository,
} from "@s-hirano-ist/s-core/books/repositories/books-query-repository.interface";
import {
	makeCreatedAt,
	makeExportedAt,
	makeId,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { makePath } from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
import prisma from "@/prisma";

async function findByISBN(
	isbn: ISBN,
	userId: UserId,
): Promise<UnexportedBook | ExportedBook | null> {
	const data = await prisma.book.findUnique({
		where: { isbn_userId: { isbn, userId } },
		select: {
			id: true,
			userId: true,
			isbn: true,
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
		isbn: makeISBN(data.isbn),
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
			isbn: true,
			title: true,
			googleImgSrc: true,
			imagePath: true,
			googleAuthors: true,
			googleSubTitle: true,
		},
		...params,
	});
	return data.map((d) => ({
		id: makeId(d.id),
		isbn: makeISBN(d.isbn),
		title: makeBookTitle(d.title),
		googleImgSrc: d.googleImgSrc ? makeGoogleImgSrc(d.googleImgSrc) : undefined,
		imagePath: d.imagePath ? makePath(d.imagePath, false) : undefined,
		googleAuthors:
			d.googleAuthors.length > 0
				? makeGoogleAuthors(d.googleAuthors)
				: undefined,
		googleSubTitle: d.googleSubTitle
			? makeGoogleSubTitle(d.googleSubTitle)
			: undefined,
	}));
}

async function count(userId: UserId, status: Status): Promise<number> {
	const data = await prisma.book.count({ where: { userId, status } });
	return data;
}

export const booksQueryRepository: IBooksQueryRepository = {
	findByISBN,
	findMany,
	count,
};
