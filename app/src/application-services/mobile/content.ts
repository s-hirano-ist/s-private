import "server-only";
import type { ServerAction } from "@/common/types";
import { addArticleCore } from "@/application-services/articles/add-article.core";
import { defaultAddArticleDeps } from "@/application-services/articles/add-article.deps";
import { deleteArticleCore } from "@/application-services/articles/delete-article.core";
import { defaultDeleteArticleDeps } from "@/application-services/articles/delete-article.deps";
import { addBooksCore } from "@/application-services/books/add-books.core";
import { defaultAddBooksDeps } from "@/application-services/books/add-books.deps";
import { deleteBooksCore } from "@/application-services/books/delete-books.core";
import { defaultDeleteBooksDeps } from "@/application-services/books/delete-books.deps";
import { addImageCore } from "@/application-services/images/add-image.core";
import { defaultAddImageDeps } from "@/application-services/images/add-image.deps";
import { deleteImageCore } from "@/application-services/images/delete-image.core";
import { defaultDeleteImageDeps } from "@/application-services/images/delete-image.deps";
import { MobileApiError } from "@/application-services/mobile/auth";
import { addNoteCore } from "@/application-services/notes/add-note.core";
import { defaultAddNoteDeps } from "@/application-services/notes/add-note.deps";
import { deleteNoteCore } from "@/application-services/notes/delete-note.core";
import { defaultDeleteNoteDeps } from "@/application-services/notes/delete-note.deps";
import prisma from "@/prisma";
import {
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { z } from "zod";

export const domains = ["articles", "notes", "images", "books"] as const;
export type MobileDomain = (typeof domains)[number];
export const domainSchema = z.enum(domains);
export const statusSchema = z.enum(["UNEXPORTED", "LAST_UPDATED", "EXPORTED"]);
export const listSchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(30),
	offset: z.coerce.number().int().min(0).default(0),
	status: statusSchema.optional(),
});
/** Temporary whole-request limit until the milestone-4 chunked upload flow. */
export const MOBILE_MULTIPART_LIMIT = 1_200_000;
const operationIdSchema = z.uuid();
const articleSchema = z.strictObject({
	operationId: operationIdSchema,
	title: z.string().min(1),
	quote: z.string().default(""),
	url: z.url(),
	category: z.string().min(1),
});
const noteSchema = z.strictObject({
	operationId: operationIdSchema,
	title: z.string().min(1),
	markdown: z.string(),
});

function serialize<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

export async function listMobileContent(
	domain: MobileDomain,
	userId: string,
	query: z.infer<typeof listSchema>,
) {
	const where = { userId, ...(query.status ? { status: query.status } : {}) };
	const args = {
		where,
		orderBy: { createdAt: "desc" as const },
		skip: query.offset,
		take: query.limit,
	};
	switch (domain) {
		case "articles": {
			const [data, totalCount] = await Promise.all([
				prisma.article.findMany({
					...args,
					include: { Category: { select: { name: true } } },
				}),
				prisma.article.count({ where }),
			]);
			return {
				data: serialize(
					data.map(({ Category, ...article }) =>
						Object.assign(article, { categoryName: Category.name }),
					),
				),
				totalCount,
			};
		}
		case "notes": {
			const [data, totalCount] = await Promise.all([
				prisma.note.findMany(args),
				prisma.note.count({ where }),
			]);
			return { data: serialize(data), totalCount };
		}
		case "images": {
			const [data, totalCount] = await Promise.all([
				prisma.image.findMany(args),
				prisma.image.count({ where }),
			]);
			return { data: serialize(data), totalCount };
		}
		case "books": {
			const [data, totalCount] = await Promise.all([
				prisma.book.findMany(args),
				prisma.book.count({ where }),
			]);
			return { data: serialize(data), totalCount };
		}
	}
	throw new MobileApiError("NOT_FOUND", 404);
}

export async function getMobileContent(
	domain: MobileDomain,
	userId: string,
	id: string,
) {
	let data: unknown;
	switch (domain) {
		case "articles": {
			const article = await prisma.article.findFirst({
				where: { id, userId },
				include: { Category: { select: { name: true } } },
			});
			if (article) {
				const { Category, ...item } = article;
				data = { ...item, categoryName: Category.name };
			}
			break;
		}
		case "notes":
			data = await prisma.note.findFirst({ where: { id, userId } });
			break;
		case "images":
			data = await prisma.image.findFirst({ where: { id, userId } });
			break;
		case "books":
			data = await prisma.book.findFirst({ where: { id, userId } });
			break;
	}
	if (!data) throw new MobileApiError("NOT_FOUND", 404);
	return serialize(data);
}

export async function listMobileCategories(userId: string) {
	return prisma.category.findMany({
		where: { userId },
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});
}

function resultOrThrow(result: ServerAction): void {
	if (result.success) return;
	if (result.message === "duplicated")
		throw new MobileApiError("DUPLICATE", 409);
	if (
		["prismaUnexpected", "storageError", "unexpected"].includes(result.message)
	) {
		throw new MobileApiError("INTERNAL_ERROR", 500);
	}
	throw new MobileApiError("VALIDATION_ERROR", 422);
}

/** Shares the existing Web creation services and their domain validation. */
export async function createMobileContent(
	domain: MobileDomain,
	userId: string,
	body: unknown,
): Promise<void> {
	const form = new FormData();
	let result: ServerAction;
	switch (domain) {
		case "articles": {
			const input = articleSchema.parse(body);
			for (const key of ["title", "quote", "url", "category"] as const)
				form.set(key, input[key]);
			result = await addArticleCore(
				form,
				defaultAddArticleDeps,
				makeUserId(userId),
			);
			break;
		}
		case "notes": {
			const input = noteSchema.parse(body);
			form.set("title", input.title);
			form.set("markdown", input.markdown);
			result = await addNoteCore(form, defaultAddNoteDeps, makeUserId(userId));
			break;
		}
		case "images": {
			if (!(body instanceof FormData))
				throw new MobileApiError("VALIDATION_ERROR", 422);
			operationIdSchema.parse(body.get("operationId"));
			const file = body.get("file");
			if (!(file instanceof File) || file.size > 1024 * 1024)
				throw new MobileApiError("UPLOAD_TOO_LARGE", 413);
			result = await addImageCore(
				body,
				defaultAddImageDeps,
				makeUserId(userId),
			);
			break;
		}
		case "books": {
			if (!(body instanceof FormData))
				throw new MobileApiError("VALIDATION_ERROR", 422);
			operationIdSchema.parse(body.get("operationId"));
			const file = body.get("image");
			if (!(file instanceof File) || file.size > 1024 * 1024)
				throw new MobileApiError("UPLOAD_TOO_LARGE", 413);
			result = await addBooksCore(
				body,
				defaultAddBooksDeps,
				makeUserId(userId),
			);
			break;
		}
	}
	resultOrThrow(result);
}

export async function deleteMobileContent(
	domain: MobileDomain,
	userId: string,
	id: string,
): Promise<void> {
	const item = (await getMobileContent(domain, userId, id)) as {
		status: string;
	};
	if (item.status !== "UNEXPORTED")
		throw new MobileApiError("NOT_DELETABLE", 409);
	const validatedId = makeId(id);
	let result: ServerAction;
	switch (domain) {
		case "articles":
			result = await deleteArticleCore(
				validatedId,
				defaultDeleteArticleDeps,
				makeUserId(userId),
			);
			break;
		case "notes":
			result = await deleteNoteCore(
				validatedId,
				defaultDeleteNoteDeps,
				makeUserId(userId),
			);
			break;
		case "images":
			result = await deleteImageCore(
				validatedId,
				defaultDeleteImageDeps,
				makeUserId(userId),
			);
			break;
		case "books":
			result = await deleteBooksCore(
				validatedId,
				defaultDeleteBooksDeps,
				makeUserId(userId),
			);
			break;
	}
	resultOrThrow(result);
}
