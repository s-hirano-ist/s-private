import type { MobileDeps } from "@s-hirano-ist/s-backend/mobile/deps";
import type { MobileDomain } from "@s-hirano-ist/s-backend/mobile/models";
import type { createVectorSearch } from "@s-hirano-ist/s-backend/search/vector-search";
import type { DatabaseClient } from "@s-hirano-ist/s-backend/shared/database";
import type { IStorageService } from "@s-hirano-ist/s-core/shared-kernel/services/storage-service.interface";
import type { z } from "zod";
import * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import { MobileApiError } from "@s-hirano-ist/s-backend/mobile/error";
import {
	getSyncHead,
	listSyncSnapshot,
	listSyncChanges,
} from "@s-hirano-ist/s-backend/mobile/sync";
import { ISBN } from "@s-hirano-ist/s-core/books/entities/book-entity";
import { Readable } from "node:stream";

// DB Dates become ISO strings, then the public DTO schema strips internal fields.
export function jsonValue(value: unknown): unknown {
	return JSON.parse(JSON.stringify(value));
}
export type ReadServiceDeps = {
	database: DatabaseClient;
	mobile: Pick<MobileDeps, "content" | "sync">;
	searchVectors: ReturnType<typeof createVectorSearch>;
	storage: {
		books: Pick<IStorageService, "getImage">;
		images: Pick<IStorageService, "getImage">;
	};
};
export function createReadService(deps: ReadServiceDeps) {
	const { database, mobile } = deps;
	async function detail(domain: MobileDomain, owner: string, id: string) {
		const record = await mobile.content.getContent(domain, owner, id);
		if (!record) throw new MobileApiError("NOT_FOUND", 404);
		return jsonValue(record);
	}
	async function page(
		domain: MobileDomain,
		owner: string,
		query: z.output<typeof schemas.listQuerySchema>,
	) {
		const result = await mobile.content.listContent(domain, owner, query);
		return {
			...result,
			data: jsonValue(result.data),
			offset: query.offset,
			limit: query.limit,
		};
	}
	async function count(
		domain: MobileDomain,
		owner: string,
		query: z.output<typeof schemas.countQuerySchema>,
	) {
		const where = { userId: owner, ...query };
		switch (domain) {
			case "articles":
				return { count: await database.article.count({ where }) };
			case "notes":
				return { count: await database.note.count({ where }) };
			case "images":
				return { count: await database.image.count({ where }) };
			case "books":
				return { count: await database.book.count({ where }) };
		}
		throw new Error("Unsupported content domain");
	}
	return {
		detail,
		page,
		count,
		async lookup(domain: "books" | "notes", owner: string, key: string) {
			const normalized = domain === "books" ? ISBN.safeParse(key) : null;
			if (normalized && !normalized.success)
				throw new MobileApiError("VALIDATION_ERROR", 422);
			const id = await mobile.content.lookupContentId(
				domain,
				owner,
				normalized?.success ? normalized.data : key,
			);
			if (!id) throw new MobileApiError("NOT_FOUND", 404);
			return detail(domain, owner, id);
		},
		async categories(owner: string) {
			return schemas.categorySchema
				.array()
				.parse(await mobile.content.listCategories(owner));
		},
		async head(owner: string) {
			return { cursor: await getSyncHead(owner, mobile) };
		},
		async snapshot(
			owner: string,
			query: z.output<typeof schemas.snapshotQuerySchema>,
		) {
			const result = await listSyncSnapshot(owner, query, mobile);
			return schemas.snapshotPageSchema.parse({
				data: result.data.map((record) => ({
					domain: query.domain,
					record: jsonValue(record),
				})),
				nextAfter: result.nextAfter ?? null,
			});
		},
		async changes(
			owner: string,
			query: z.output<typeof schemas.changesQuerySchema>,
		) {
			const result = await listSyncChanges(owner, query, mobile);
			return schemas.changesPageSchema.parse({
				...result,
				data: result.data.map((event) => {
					if (event.action === "delete") return event;
					let record: unknown;
					if ("category" in event) record = event.category;
					else if ("record" in event) record = event.record;
					return {
						id: event.id,
						version: event.version,
						action: "upsert",
						value: { domain: event.domain, record: jsonValue(record) },
					};
				}),
			});
		},
		async media(
			owner: string,
			domain: "images" | "books",
			id: string,
			variant: "original" | "thumbnail",
		) {
			const record = await detail(domain, owner, id);
			const item =
				domain === "images"
					? schemas.imageSchema.parse(record)
					: schemas.bookSchema.parse(record);
			const path = "path" in item ? item.path : item.imagePath;
			if (!path) throw new MobileApiError("NOT_FOUND", 404);
			const stream = await deps.storage[domain].getImage(
				path,
				variant === "thumbnail",
			);
			if (!(stream instanceof Readable))
				throw new Error("Unsupported storage stream");
			const extension = path.split(".").at(-1)?.toLowerCase();
			const extensionTypes: Record<string, string> = {
				png: "image/png",
				webp: "image/webp",
			};
			const originalType =
				"contentType" in item
					? item.contentType
					: (extensionTypes[extension ?? ""] ?? "image/jpeg");
			const iterator = stream[Symbol.asyncIterator]();
			const body = new ReadableStream<Uint8Array>({
				async pull(controller) {
					const result: IteratorResult<unknown> = await iterator.next();
					if (result.done) {
						controller.close();
						return;
					}
					if (!(result.value instanceof Uint8Array))
						throw new Error("Invalid storage chunk");
					controller.enqueue(new Uint8Array(result.value));
				},
				cancel() {
					stream.destroy();
				},
			});
			return new Response(body, {
				headers: {
					"content-type": variant === "thumbnail" ? "image/webp" : originalType,
					"cache-control": "private, no-store",
				},
			});
		},
		async search(
			owner: string,
			query: z.output<typeof schemas.searchQuerySchema>,
		) {
			const hits = (
				await deps.searchVectors(query.query, { topK: query.limit })
			).results;
			const isbns = hits.flatMap((hit) =>
				hit.content_type === "books"
					? [/\/book\/([^/]+)\.md$/u.exec(hit.doc_id)?.[1] ?? ""]
					: [],
			);
			const [articles, notes, books] = await Promise.all([
				database.article.findMany({
					where: {
						userId: owner,
						url: {
							in: hits.flatMap((hit) =>
								hit.content_type === "articles" && hit.url ? [hit.url] : [],
							),
						},
					},
					include: { Category: { select: { id: true, name: true } } },
				}),
				database.note.findMany({
					where: {
						userId: owner,
						title: {
							in: hits
								.filter((hit) => hit.content_type === "notes")
								.map((hit) => hit.heading_path[0] ?? hit.title),
						},
					},
				}),
				database.book.findMany({
					where: { userId: owner, isbn: { in: isbns } },
				}),
			]);
			const data: z.output<typeof schemas.searchHitSchema>[] = [];
			const seen = new Set<string>();
			for (const hit of hits) {
				let result: z.output<typeof schemas.searchHitSchema> | undefined;
				switch (hit.content_type) {
					case "articles": {
						const record = articles.find((item) => item.url === hit.url);
						if (record)
							result = {
								id: record.id,
								type: "articles",
								title: record.title,
								snippet: (record.quote ?? record.ogDescription ?? "").slice(
									0,
									150,
								),
								url: record.url,
								category: record.Category,
							};
						break;
					}
					case "notes": {
						const record = notes.find(
							(item) => item.title === (hit.heading_path[0] ?? hit.title),
						);
						if (record)
							result = {
								id: record.id,
								type: "notes",
								title: record.title,
								snippet: record.markdown.slice(0, 150),
							};
						break;
					}
					case "books": {
						const isbn = /\/book\/([^/]+)\.md$/u.exec(hit.doc_id)?.[1];
						const record = books.find((item) => item.isbn === isbn);
						if (record)
							result = {
								id: record.id,
								type: "books",
								title: record.title,
								snippet: (
									record.markdown ??
									record.googleDescription ??
									""
								).slice(0, 150),
								isbn: record.isbn,
								rating: record.rating,
								tags: record.tags,
							};
					}
				}
				if (result && !seen.has(`${result.type}:${result.id}`)) {
					seen.add(`${result.type}:${result.id}`);
					data.push(result);
				}
			}
			// Index payloads are untrusted/global. Only owner DB fields cross the API boundary.
			return schemas.searchResponseSchema.parse({ query: query.query, data });
		},
	};
}
export type ReadService = ReturnType<typeof createReadService>;
