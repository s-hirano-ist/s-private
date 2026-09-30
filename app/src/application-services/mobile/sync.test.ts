import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	version: vi.fn(),
	changes: vi.fn(),
	articles: vi.fn(),
	notes: vi.fn(),
	books: vi.fn(),
	images: vi.fn(),
	categories: vi.fn(),
}));
vi.mock("@/prisma", () => ({
	default: {
		mobileSyncVersion: { findUnique: mocks.version },
		mobileSyncChange: { findMany: mocks.changes },
		article: { findMany: mocks.articles },
		note: { findMany: mocks.notes },
		book: { findMany: mocks.books },
		image: { findMany: mocks.images },
		category: { findMany: mocks.categories },
	},
}));
import {
	changesQuerySchema,
	getSyncHead,
	listSyncChanges,
	listSyncSnapshot,
	snapshotQuerySchema,
} from "./sync";

describe("mobile delta sync", () => {
	const cursor = (owner: string, version: string) =>
		Buffer.from(JSON.stringify([owner, version])).toString("base64url");
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.version.mockResolvedValue({ version: 10n });
		for (const key of [
			"articles",
			"notes",
			"books",
			"images",
			"categories",
		] as const)
			mocks[key].mockResolvedValue([]);
	});

	test("head is owner scoped and starts at zero", async () => {
		mocks.version.mockResolvedValue(null);
		await expect(getSyncHead("owner-1")).resolves.toBe(cursor("owner-1", "0"));
		expect(mocks.version).toHaveBeenCalledWith({
			where: { userId: "owner-1" },
			select: { version: true },
		});
	});

	test("snapshot uses owner-scoped keyset pages", async () => {
		mocks.notes.mockResolvedValue([{ id: "b" }, { id: "c" }, { id: "d" }]);
		const page = await listSyncSnapshot(
			"owner-1",
			snapshotQuerySchema.parse({ domain: "notes", after: "a", limit: "2" }),
		);
		expect(page).toEqual({ data: [{ id: "b" }, { id: "c" }], nextAfter: "c" });
		expect(mocks.notes).toHaveBeenCalledWith({
			where: { userId: "owner-1", id: { gt: "a" } },
			orderBy: { id: "asc" },
			take: 3,
		});
	});

	test("a deleted row becomes a tombstone and the cursor advances once", async () => {
		mocks.changes.mockResolvedValue([
			{
				userId: "owner-1",
				version: 8n,
				domain: "notes",
				recordId: "gone",
				action: "upsert",
			},
			{
				userId: "owner-1",
				version: 9n,
				domain: "notes",
				recordId: "gone",
				action: "delete",
			},
		]);
		const page = await listSyncChanges(
			"owner-1",
			changesQuerySchema.parse({ cursor: cursor("owner-1", "7"), limit: "1" }),
		);
		expect(page).toEqual({
			data: [{ version: "8", domain: "notes", id: "gone", action: "delete" }],
			nextCursor: cursor("owner-1", "8"),
			hasMore: true,
		});
		expect(mocks.changes).toHaveBeenCalledWith({
			where: { userId: "owner-1", version: { gt: 7n } },
			orderBy: { version: "asc" },
			take: 2,
		});
	});

	test("category rename is delivered without reloading articles", async () => {
		mocks.changes.mockResolvedValue([
			{
				userId: "owner-1",
				version: 10n,
				domain: "categories",
				recordId: "category-1",
				action: "upsert",
			},
		]);
		mocks.categories.mockResolvedValue([{ id: "category-1", name: "Renamed" }]);
		const page = await listSyncChanges(
			"owner-1",
			changesQuerySchema.parse({ cursor: cursor("owner-1", "9") }),
		);
		expect(page.data).toEqual([
			{
				version: "10",
				domain: "categories",
				id: "category-1",
				action: "upsert",
				category: { id: "category-1", name: "Renamed" },
			},
		]);
		expect(mocks.articles).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "owner-1", id: { in: [] } },
			}),
		);
	});

	test("an explicit delete remains a tombstone if the ID exists again", async () => {
		mocks.changes.mockResolvedValue([
			{
				userId: "owner-1",
				version: 10n,
				domain: "notes",
				recordId: "same-id",
				action: "delete",
			},
		]);
		mocks.notes.mockResolvedValue([{ id: "same-id", title: "Recreated" }]);
		const page = await listSyncChanges(
			"owner-1",
			changesQuerySchema.parse({ cursor: cursor("owner-1", "9") }),
		);
		expect(page.data).toEqual([
			{ version: "10", domain: "notes", id: "same-id", action: "delete" },
		]);
	});

	test("rejects a cursor issued for another owner", async () => {
		await expect(
			listSyncChanges(
				"owner-2",
				changesQuerySchema.parse({ cursor: cursor("owner-1", "3") }),
			),
		).rejects.toMatchObject({
			code: "INVALID_SYNC_CURSOR",
		});
		expect(mocks.changes).not.toHaveBeenCalled();
	});
});
