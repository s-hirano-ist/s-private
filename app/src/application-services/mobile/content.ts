import "server-only";
import type { ServerAction, ServerActionWithData } from "@/common/types";
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
import {
	runMobileOperation,
	type MobileCreateResult,
} from "@/application-services/mobile/operations";
import { addNoteCore } from "@/application-services/notes/add-note.core";
import { defaultAddNoteDeps } from "@/application-services/notes/add-note.deps";
import { deleteNoteCore } from "@/application-services/notes/delete-note.core";
import { defaultDeleteNoteDeps } from "@/application-services/notes/delete-note.deps";
import prisma from "@/prisma";
import {
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createHash } from "node:crypto";
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
): Promise<MobileCreateResult> {
	const form = new FormData();
	let result: ServerActionWithData<{ id: string }>;
	let operationId: string;
	let hashInput: unknown;
	let resourceLookup: () => Promise<{ id: string } | null>;
	switch (domain) {
		case "articles": {
			const input = articleSchema.parse(body);
			operationId = input.operationId;
			hashInput = input;
			for (const key of ["title", "quote", "url", "category"] as const)
				form.set(key, input[key]);
			resourceLookup = () =>
				prisma.article.findFirst({
					where: { userId, url: input.url },
					select: { id: true },
				});
			break;
		}
		case "notes": {
			const input = noteSchema.parse(body);
			operationId = input.operationId;
			hashInput = input;
			form.set("title", input.title);
			form.set("markdown", input.markdown);
			resourceLookup = () =>
				prisma.note.findFirst({
					where: { userId, title: input.title },
					select: { id: true },
				});
			break;
		}
		case "images": {
			if (!(body instanceof FormData))
				throw new MobileApiError("VALIDATION_ERROR", 422);
			operationId = operationIdSchema.parse(body.get("operationId"));
			const file = body.get("file");
			if (!(file instanceof File) || file.size > 10 * 1024 * 1024)
				throw new MobileApiError("UPLOAD_TOO_LARGE", 413);
			hashInput = {
				operationId,
				fileHash: createHash("sha256")
					.update(Buffer.from(await file.arrayBuffer()))
					.digest("hex"),
				contentType: file.type,
			};
			resourceLookup = () =>
				prisma.image.findFirst({
					where: { userId },
					orderBy: { createdAt: "desc" },
					select: { id: true },
				});
			break;
		}
		case "books": {
			if (!(body instanceof FormData))
				throw new MobileApiError("VALIDATION_ERROR", 422);
			operationId = operationIdSchema.parse(body.get("operationId"));
			const file = body.get("image");
			if (!(file instanceof File) || file.size > 10 * 1024 * 1024)
				throw new MobileApiError("UPLOAD_TOO_LARGE", 413);
			const isbn = body.get("isbn");
			if (typeof isbn !== "string")
				throw new MobileApiError("VALIDATION_ERROR", 422);
			hashInput = {
				...Object.fromEntries(
					[...body.entries()].filter(([, value]) => typeof value === "string"),
				),
				fileHash: createHash("sha256")
					.update(Buffer.from(await file.arrayBuffer()))
					.digest("hex"),
			};
			resourceLookup = () =>
				prisma.book.findFirst({
					where: { userId, isbn },
					select: { id: true },
				});
			break;
		}
	}
	return runMobileOperation(
		userId,
		domain,
		operationId,
		hashInput,
		async () => {
			switch (domain) {
				case "articles":
					result = await addArticleCore(
						form,
						defaultAddArticleDeps,
						makeUserId(userId),
					);
					break;
				case "notes":
					result = await addNoteCore(
						form,
						defaultAddNoteDeps,
						makeUserId(userId),
					);
					break;
				case "images":
					result = await addImageCore(
						body as FormData,
						defaultAddImageDeps,
						makeUserId(userId),
					);
					break;
				case "books":
					result = await addBooksCore(
						body as FormData,
						defaultAddBooksDeps,
						makeUserId(userId),
					);
					break;
			}
			if (!result.success && result.message === "duplicated") {
				const duplicate = await resourceLookup();
				if (duplicate) return duplicate.id;
			}
			resultOrThrow(result);
			if (result.data?.id) return result.data.id;
			const resource = await resourceLookup();
			if (!resource) throw new MobileApiError("INTERNAL_ERROR", 500);
			return resource.id;
		},
	);
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
