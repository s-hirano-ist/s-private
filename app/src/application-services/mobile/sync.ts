import "server-only";
import { MobileApiError } from "@/application-services/mobile/auth";
import {
	defaultMobileDeps,
	type MobileDeps,
} from "@/application-services/mobile/deps";
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

export async function getSyncHead(
	userId: string,
	deps: Pick<MobileDeps, "sync"> = defaultMobileDeps,
): Promise<string> {
	return encodeCursor(userId, await deps.sync.getSyncVersion(userId));
}

/** Keyset pagination is stable when earlier rows are deleted during bootstrap. */
export async function listSyncSnapshot(
	userId: string,
	query: z.infer<typeof snapshotQuerySchema>,
	deps: Pick<MobileDeps, "sync"> = defaultMobileDeps,
) {
	const rows = await deps.sync.snapshot(
		query.domain,
		userId,
		query.after,
		query.limit + 1,
	);
	const hasMore = rows.length > query.limit;
	const data = rows.slice(0, query.limit);
	return { data, nextAfter: hasMore ? data.at(-1)?.id : null };
}

/** Resolve events in batches so a page makes at most five content queries. */
export async function listSyncChanges(
	userId: string,
	query: z.infer<typeof changesQuerySchema>,
	deps: Pick<MobileDeps, "sync"> = defaultMobileDeps,
) {
	const cursor = decodeCursor(userId, query.cursor);
	const head = await deps.sync.getSyncVersion(userId);
	if (cursor > head) throw new MobileApiError("INVALID_SYNC_CURSOR", 422);
	const events = await deps.sync.changes(userId, cursor, query.limit + 1);
	const page = events.slice(0, query.limit);
	const byKey = await deps.sync.changeRecords(userId, page);
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
