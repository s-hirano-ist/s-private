import type {
	MobileDomain,
	ReadModelByDomain,
	SnapshotQuery,
	ChangesQuery,
} from "@s-hirano-ist/s-application/content/models";
import type {
	MobileContentRepository,
	MobileSyncRepository,
} from "@s-hirano-ist/s-application/mobile/ports";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import {
	getSyncHead,
	listSyncSnapshot,
	listSyncChanges,
} from "@s-hirano-ist/s-application/mobile/sync";
import { ISBN } from "@s-hirano-ist/s-core/books/entities/book-entity";
export type SearchCandidate = {
	key: string;
	type: "articles" | "notes" | "books";
};
export type SearchHit = { id: string; snippet: string; title: string } & (
	| { category: { id: string; name: string }; type: "articles"; url: string }
	| { type: "notes" }
	| { isbn: string; rating: number; tags: string[]; type: "books" }
);
export type SearchIndex = {
	search(query: string, limit: number): Promise<SearchCandidate[]>;
};
export type ContentQueryRepository = {
	count(
		domain: MobileDomain,
		owner: string,
		status?: ReadModelByDomain["notes"]["status"],
	): Promise<number>;
	resolve(
		owner: string,
		candidates: SearchCandidate[],
	): Promise<{ hit: SearchHit; key: string }[]>;
};
export type MediaReader = {
	getImage(
		path: string,
		thumbnail: boolean,
	): Promise<AsyncIterable<Uint8Array>>;
};
export type ReadQueriesDeps = {
	content: MobileContentRepository;
	media: { books: MediaReader; images: MediaReader };
	query: ContentQueryRepository;
	search: SearchIndex;
	sync: MobileSyncRepository;
};
export function createReadQueries(deps: ReadQueriesDeps) {
	async function detail<D extends MobileDomain>(
		domain: D,
		owner: string,
		id: string,
	) {
		const record = await deps.content.getContent(domain, owner, id);
		if (!record) throw new ApplicationError("NOT_FOUND");
		return record;
	}
	return {
		detail,
		page: <D extends MobileDomain>(
			domain: D,
			owner: string,
			query: {
				limit: number;
				offset: number;
				status?: ReadModelByDomain["notes"]["status"];
			},
		) => deps.content.listContent(domain, owner, query),
		count: async (
			domain: MobileDomain,
			owner: string,
			query: { status?: ReadModelByDomain["notes"]["status"] },
		) => ({ count: await deps.query.count(domain, owner, query.status) }),
		async lookup<D extends "books" | "notes">(
			domain: D,
			owner: string,
			key: string,
		) {
			const normalized = domain === "books" ? ISBN.safeParse(key) : null;
			if (normalized && !normalized.success)
				throw new ApplicationError("VALIDATION_ERROR");
			const id = await deps.content.lookupContentId(
				domain,
				owner,
				normalized?.success ? normalized.data : key,
			);
			if (!id) throw new ApplicationError("NOT_FOUND");
			return detail(domain, owner, id);
		},
		categories: (owner: string) => deps.content.listCategories(owner),
		head: async (owner: string) => ({ cursor: await getSyncHead(owner, deps) }),
		snapshot: (owner: string, query: SnapshotQuery) =>
			listSyncSnapshot(owner, query, deps),
		changes: (owner: string, query: ChangesQuery) =>
			listSyncChanges(owner, query, deps),
		async media(
			owner: string,
			domain: "images" | "books",
			id: string,
			variant: "original" | "thumbnail",
		) {
			const record = await detail(domain, owner, id);
			const path = "path" in record ? record.path : record.imagePath;
			if (!path) throw new ApplicationError("NOT_FOUND");
			const body = await deps.media[domain].getImage(
				path,
				variant === "thumbnail",
			);
			const extension = path.split(".").at(-1)?.toLowerCase();
			const types: Record<string, string> = {
				png: "image/png",
				webp: "image/webp",
			};
			let contentType =
				"contentType" in record
					? record.contentType
					: (types[extension ?? ""] ?? "image/jpeg");
			if (variant === "thumbnail") contentType = "image/webp";
			return { body, contentType };
		},
		async search(owner: string, query: { limit: number; query: string }) {
			const candidates = await deps.search.search(query.query, query.limit);
			const records = await deps.query.resolve(owner, candidates);
			const byKey = new Map(
				records.map((record) => [
					`${record.hit.type}:${record.key}`,
					record.hit,
				]),
			);
			const seen = new Set<string>();
			const data: SearchHit[] = [];
			for (const candidate of candidates) {
				const hit = byKey.get(`${candidate.type}:${candidate.key}`);
				if (!hit || seen.has(`${hit.type}:${hit.id}`)) continue;
				seen.add(`${hit.type}:${hit.id}`);
				data.push(hit);
			}
			return { query: query.query, data };
		},
	};
}
export type ReadQueries = ReturnType<typeof createReadQueries>;
