import type { ReadQueries } from "@s-hirano-ist/s-application/content/queries";
import * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import {
	toDto,
	toSnapshot,
	snapshotDto,
} from "s-private-backend/api/read-models";
export function createReadService(queries: ReadQueries) {
	return {
		detail: async <D extends Parameters<ReadQueries["detail"]>[0]>(
			domain: D,
			owner: string,
			id: string,
		) => toDto(domain, await queries.detail(domain, owner, id)),
		async page<D extends Parameters<ReadQueries["page"]>[0]>(
			domain: D,
			owner: string,
			query: Parameters<ReadQueries["page"]>[2],
		) {
			const result = await queries.page(domain, owner, query);
			return {
				...result,
				data: result.data.map((record) => toDto(domain, record)),
				offset: query.offset,
				limit: query.limit,
			};
		},
		count: queries.count,
		lookup: async <D extends "books" | "notes">(
			domain: D,
			owner: string,
			key: string,
		) => toDto(domain, await queries.lookup(domain, owner, key)),
		categories: async (owner: string) =>
			schemas.categorySchema.array().parse(await queries.categories(owner)),
		head: queries.head,
		async snapshot(
			owner: string,
			query: Parameters<ReadQueries["snapshot"]>[1],
		) {
			const result = await queries.snapshot(owner, query);
			return schemas.snapshotPageSchema.parse({
				data: result.data.map((record) => snapshotDto(query.domain, record)),
				nextAfter: result.nextAfter ?? null,
			});
		},
		async changes(owner: string, query: Parameters<ReadQueries["changes"]>[1]) {
			const result = await queries.changes(owner, query);
			return schemas.changesPageSchema.parse({
				...result,
				data: result.data.map((event) =>
					event.action === "delete"
						? event
						: {
								id: event.id,
								version: event.version,
								action: event.action,
								value: toSnapshot(event.value),
							},
				),
			});
		},
		async media(...args: Parameters<ReadQueries["media"]>) {
			const { body, contentType } = await queries.media(...args);
			const iterator = body[Symbol.asyncIterator]();
			return new Response(
				new ReadableStream<Uint8Array>({
					async pull(controller) {
						try {
							const result = await iterator.next();
							if (result.done) controller.close();
							else controller.enqueue(result.value);
						} catch (error) {
							await iterator.return?.();
							controller.error(error);
						}
					},
					async cancel() {
						await iterator.return?.();
					},
				}),
				{
					headers: {
						"content-type": contentType,
						"cache-control": "private, no-store",
					},
				},
			);
		},
		search: async (...args: Parameters<ReadQueries["search"]>) =>
			schemas.searchResponseSchema.parse(await queries.search(...args)),
	};
}
export type ReadService = ReturnType<typeof createReadService>;
