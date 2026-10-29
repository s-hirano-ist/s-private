import type {
	SnapshotQuery,
	ChangesQuery,
} from "@s-hirano-ist/s-application/content/models";
import type { StoredSnapshot } from "@s-hirano-ist/s-application/content/models";
import type { SyncDomain } from "@s-hirano-ist/s-application/content/models";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { type MobileDeps } from "@s-hirano-ist/s-application/mobile/deps";
import { z } from "zod";

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
	throw new ApplicationError("INVALID_SYNC_CURSOR");
}

export async function getSyncHead(
	userId: string,
	deps: Pick<MobileDeps, "sync">,
): Promise<string> {
	return encodeCursor(userId, await deps.sync.getSyncVersion(userId));
}

/** Keyset pagination is stable when earlier rows are deleted during bootstrap. */
export async function listSyncSnapshot(
	userId: string,
	query: SnapshotQuery,
	deps: Pick<MobileDeps, "sync">,
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
	query: ChangesQuery,
	deps: Pick<MobileDeps, "sync">,
) {
	const cursor = decodeCursor(userId, query.cursor);
	const head = await deps.sync.getSyncVersion(userId);
	if (cursor > head) throw new ApplicationError("INVALID_SYNC_CURSOR");
	const events = await deps.sync.changes(userId, cursor, query.limit + 1);
	const page = events.slice(0, query.limit);
	const byKey = await deps.sync.changeRecords(userId, page);
	const data = page.map((event): StoredSyncChange => {
		const value = byKey.get(`${event.domain}:${event.recordId}`);
		const base = { id: event.recordId, version: event.version.toString() };
		if (event.action === "delete" || !value)
			return { ...base, action: "delete", domain: event.domain };
		return { ...base, action: "upsert", value };
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

export type StoredSyncChange = { id: string; version: string } & (
	| { action: "delete"; domain: SyncDomain }
	| { action: "upsert"; value: StoredSnapshot }
);
