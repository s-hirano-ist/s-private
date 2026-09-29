import "server-only";
import { MobileApiError } from "@/application-services/mobile/auth";
import prisma from "@/prisma";
import { z } from "zod";

export const syncDomainSchema = z.enum([
	"articles",
	"notes",
	"books",
	"images",
	"categories",
]);
export type SyncDomain = z.infer<typeof syncDomainSchema>;
export const snapshotQuerySchema = z.object({
	domain: syncDomainSchema,
	after: z.string().max(36).default(""),
	limit: z.coerce.number().int().min(1).max(100).default(100),
});
export const changesQuerySchema = z.object({
	cursor: z.string().min(1).max(512),
	limit: z.coerce.number().int().min(1).max(100).default(100),
});

function encodeCursor(userId: string, version: bigint): string {
	return Buffer.from(JSON.stringify([userId, version.toString()])).toString(
		"base64url",
	);
}

function decodeCursor(userId: string, cursor: string): bigint {
	try {
		const value: unknown = JSON.parse(
			Buffer.from(cursor, "base64url").toString("utf8"),
		);
		const [cursorOwner, version] = z
			.tuple([z.string(), z.string().regex(/^\d+$/u)])
			.parse(value);
		if (cursorOwner === userId) return BigInt(version);
	} catch {
		// Invalid and foreign-owner cursors have the same response.
	}
	throw new MobileApiError("INVALID_SYNC_CURSOR", 422);
}

async function getSyncVersion(userId: string): Promise<bigint> {
	const head = await prisma.mobileSyncVersion.findUnique({
		where: { userId },
		select: { version: true },
	});
	return head?.version ?? 0n;
}

export async function getSyncHead(userId: string): Promise<string> {
	return encodeCursor(userId, await getSyncVersion(userId));
}

/** Keyset pagination is stable when earlier rows are deleted during bootstrap. */
export async function listSyncSnapshot(
	userId: string,
	query: z.infer<typeof snapshotQuerySchema>,
) {
	const where = { userId, id: { gt: query.after } };
	const take = query.limit + 1;
	let rows: { id: string }[];
	switch (query.domain) {
		case "articles":
			rows = (
				await prisma.article.findMany({
					where,
					include: { Category: { select: { name: true } } },
					orderBy: { id: "asc" },
					take,
				})
			).map(({ Category, ...record }) =>
				Object.assign(record, { categoryName: Category.name }),
			);
			break;
		case "notes":
			rows = await prisma.note.findMany({
				where,
				orderBy: { id: "asc" },
				take,
			});
			break;
		case "books":
			rows = await prisma.book.findMany({
				where,
				orderBy: { id: "asc" },
				take,
			});
			break;
		case "images":
			rows = await prisma.image.findMany({
				where,
				orderBy: { id: "asc" },
				take,
			});
			break;
		case "categories":
			rows = await prisma.category.findMany({
				where,
				select: { id: true, name: true },
				orderBy: { id: "asc" },
				take,
			});
			break;
	}
	const hasMore = rows.length > query.limit;
	const data = rows.slice(0, query.limit);
	return { data, nextAfter: hasMore ? data.at(-1)?.id : null };
}

/** Resolve events in batches so a page makes at most five content queries. */
export async function listSyncChanges(
	userId: string,
	query: z.infer<typeof changesQuerySchema>,
) {
	const cursor = decodeCursor(userId, query.cursor);
	const head = await getSyncVersion(userId);
	if (cursor > head) throw new MobileApiError("INVALID_SYNC_CURSOR", 422);
	const events = await prisma.mobileSyncChange.findMany({
		where: { userId, version: { gt: cursor } },
		orderBy: { version: "asc" },
		take: query.limit + 1,
	});
	const page = events.slice(0, query.limit);
	const ids = (domain: SyncDomain) =>
		page
			.filter((event) => event.domain === domain)
			.map((event) => event.recordId);
	const [articles, notes, books, images, categories] = await Promise.all([
		prisma.article.findMany({
			where: { userId, id: { in: ids("articles") } },
			include: { Category: { select: { name: true } } },
		}),
		prisma.note.findMany({ where: { userId, id: { in: ids("notes") } } }),
		prisma.book.findMany({ where: { userId, id: { in: ids("books") } } }),
		prisma.image.findMany({ where: { userId, id: { in: ids("images") } } }),
		prisma.category.findMany({
			where: { userId, id: { in: ids("categories") } },
			select: { id: true, name: true },
		}),
	]);
	const byKey = new Map<string, unknown>();
	for (const { Category, ...article } of articles)
		byKey.set(`articles:${article.id}`, {
			...article,
			categoryName: Category.name,
		});
	for (const [domain, records] of [
		["notes", notes],
		["books", books],
		["images", images],
		["categories", categories],
	] as const) {
		for (const record of records) byKey.set(`${domain}:${record.id}`, record);
	}
	const data = page.map((event) => {
		const record = byKey.get(`${event.domain}:${event.recordId}`);
		const deleted = event.action === "delete" || !record;
		const base = {
			version: event.version.toString(),
			domain: event.domain,
			id: event.recordId,
			action: deleted ? "delete" : "upsert",
		};
		if (deleted) return base;
		if (event.domain === "categories") return { ...base, category: record };
		return { ...base, record };
	});
	const lastEvent = page.at(-1);
	return {
		data,
		nextCursor: lastEvent
			? encodeCursor(userId, lastEvent.version)
			: query.cursor,
		hasMore: events.length > query.limit,
	};
}
