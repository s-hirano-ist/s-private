import type { MobileSyncRepository } from "s-private-backend/mobile/ports";
import {
	getSyncHead,
	listSyncChanges,
	listSyncSnapshot,
} from "s-private-backend/mobile/sync";
import { expect, test, vi } from "vitest";
function fixture() {
	return {
		getSyncVersion: vi
			.fn<MobileSyncRepository["getSyncVersion"]>()
			.mockResolvedValue(0n),
		changes: vi.fn<MobileSyncRepository["changes"]>().mockResolvedValue([]),
		changeRecords: vi
			.fn<MobileSyncRepository["changeRecords"]>()
			.mockResolvedValue(new Map()),
		snapshot: vi.fn<MobileSyncRepository["snapshot"]>().mockResolvedValue([]),
	} satisfies MobileSyncRepository;
}
test("sync cursors remain owner-bound and reject future versions", async () => {
	const sync = fixture();
	const cursor = await getSyncHead("owner", { sync });
	await expect(
		listSyncChanges("foreign", { cursor, limit: 100 }, { sync }),
	).rejects.toMatchObject({ code: "INVALID_SYNC_CURSOR" });
	sync.getSyncVersion.mockResolvedValue(10n);
	const future = await getSyncHead("owner", { sync });
	sync.getSyncVersion.mockResolvedValue(0n);
	await expect(
		listSyncChanges("owner", { cursor: future, limit: 100 }, { sync }),
	).rejects.toMatchObject({ code: "INVALID_SYNC_CURSOR" });
});
test("typed upserts and missing records preserve the change page cursor", async () => {
	const sync = fixture();
	const cursor = await getSyncHead("owner", { sync });
	sync.changes.mockResolvedValue([
		{
			action: "upsert",
			domain: "categories",
			recordId: "category",
			version: 1n,
		},
		{ action: "upsert", domain: "notes", recordId: "missing", version: 2n },
		{ action: "delete", domain: "books", recordId: "deleted", version: 3n },
	]);
	sync.changeRecords.mockResolvedValue(
		new Map([
			[
				"categories:category",
				{ domain: "categories", record: { id: "category", name: "Name" } },
			],
		]),
	);
	const page = await listSyncChanges("owner", { cursor, limit: 2 }, { sync });
	expect(page.data).toEqual([
		{
			id: "category",
			version: "1",
			action: "upsert",
			value: { domain: "categories", record: { id: "category", name: "Name" } },
		},
		{ id: "missing", version: "2", action: "delete", domain: "notes" },
	]);
	expect(page.hasMore).toBe(true);
	expect(page.nextCursor).toBe(
		Buffer.from(JSON.stringify(["owner", "2"])).toString("base64url"),
	);
});
test("snapshot pagination queries an extra row and keeps the last applied ID", async () => {
	const sync = fixture();
	sync.snapshot.mockResolvedValue([
		{ id: "a", name: "A" },
		{ id: "b", name: "B" },
	]);
	expect(
		await listSyncSnapshot(
			"owner",
			{ domain: "categories", after: "", limit: 1 },
			{ sync },
		),
	).toEqual({ data: [{ id: "a", name: "A" }], nextAfter: "a" });
	expect(sync.snapshot).toHaveBeenCalledWith("categories", "owner", "", 2);
});
