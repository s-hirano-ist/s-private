import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { createMobilePersistence } from "@s-hirano-ist/s-infrastructure/mobile/prisma-persistence";
import { expect, test, vi } from "vitest";
const note = {
	id: "note",
	userId: "owner",
	title: "Title",
	markdown: "Body",
	status: "UNEXPORTED",
	createdAt: new Date(),
	updatedAt: new Date(),
	exportedAt: null,
};
test("persistence returns a validated owner-scoped read model with actual Dates", async () => {
	const findFirst = vi.fn().mockResolvedValue(note);
	const persistence = createMobilePersistence({
		note: { findFirst },
	} as unknown as DatabaseClient);
	const record = await persistence.getContent("notes", "owner", "note");
	expect(record?.createdAt).toBeInstanceOf(Date);
	expect(record).not.toHaveProperty("userId");
	expect(findFirst).toHaveBeenCalledExactlyOnceWith({
		where: { id: "note", userId: "owner" },
	});
	findFirst.mockResolvedValue(null);
	expect(await persistence.getContent("notes", "owner", "missing")).toBeNull();
	findFirst.mockResolvedValue({ ...note, createdAt: "2026-10-01" });
	await expect(
		persistence.getContent("notes", "owner", "note"),
	).rejects.toThrow("Invalid input");
});
test("unknown persisted sync action/domain values cannot enter the typed sync service", async () => {
	const findMany = vi
		.fn()
		.mockResolvedValue([
			{ action: "unexpected", domain: "notes", recordId: "note", version: 1n },
		]);
	const persistence = createMobilePersistence({
		mobileSyncChange: { findMany },
	} as unknown as DatabaseClient);
	await expect(persistence.changes("owner", 0n, 100)).rejects.toThrow(
		"Invalid option",
	);
	findMany.mockResolvedValue([
		{ action: "upsert", domain: "unknown", recordId: "note", version: 1n },
	]);
	await expect(persistence.changes("owner", 0n, 100)).rejects.toThrow(
		"Invalid option",
	);
});
