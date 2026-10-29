import type {
	ImportRepository,
	PreparedImport,
	ImportRecord,
} from "@s-hirano-ist/s-application/batch/import-models";
import { synchronizeContent } from "@s-hirano-ist/s-application/batch/synchronize-content";
import { describe, expect, test, vi } from "vitest";
const now = new Date("2026-01-01T00:00:00Z");
function setup(records: ImportRecord[] = []) {
	const repository: ImportRepository = {
		list: vi.fn().mockResolvedValue(records),
		save: vi.fn(),
		deleteExported: vi.fn().mockResolvedValue(1),
		isMediaReferenced: vi.fn().mockResolvedValue(false),
	};
	const media = { put: vi.fn(), removeImage: vi.fn() };
	return { repository, media, clock: { now: () => now } };
}
async function* source(...items: PreparedImport[]) {
	yield* items;
}
const note = (
	key: string,
	status: ImportRecord["status"] = "EXPORTED",
): ImportRecord => ({
	id: key,
	key,
	status,
	values: { title: key, markdown: "old" },
});
describe("CLI synchronization policy", () => {
	test("dry run reports changes without writes or object operations", async () => {
		const deps = setup([note("missing")]);
		const result = await synchronizeContent(
			"notes",
			"owner",
			source({ values: { title: "new", markdown: "body" } }),
			deps,
			{ dryRun: true },
		);
		expect(result).toMatchObject({ insertedCount: 1, deletedCount: 1 });
		expect(deps.repository.save).not.toHaveBeenCalled();
		expect(deps.repository.deleteExported).not.toHaveBeenCalled();
		expect(deps.media.put).not.toHaveBeenCalled();
		expect(deps.media.removeImage).not.toHaveBeenCalled();
	});
	test("updates preserve identity and only prune absent EXPORTED records", async () => {
		const deps = setup([
			note("changed", "LAST_UPDATED"),
			note("keep-pending", "UNEXPORTED"),
			note("missing"),
		]);
		await synchronizeContent(
			"notes",
			"owner",
			source({ values: { title: "changed", markdown: "new" } }),
			deps,
			{ dryRun: false },
		);
		expect(deps.repository.save).toHaveBeenCalledWith(
			"owner",
			{
				domain: "notes",
				id: "changed",
				values: { title: "changed", markdown: "new" },
			},
			false,
			now,
		);
		expect(deps.repository.deleteExported).toHaveBeenCalledExactlyOnceWith(
			"notes",
			"owner",
			"missing",
		);
	});
	test("an incomplete source never authorizes pruning", async () => {
		const deps = setup([note("missing")]);
		async function* broken() {
			yield { values: { title: "new", markdown: "body" } };
			throw new Error("unreadable source");
		}
		await expect(
			synchronizeContent("notes", "owner", broken(), deps, { dryRun: false }),
		).rejects.toThrow("unreadable source");
		expect(deps.repository.deleteExported).not.toHaveBeenCalled();
	});
	test("an invalid input never authorizes pruning", async () => {
		const deps = setup([note("missing")]);
		await expect(
			synchronizeContent(
				"notes",
				"owner",
				source({ values: { markdown: "missing title" } }),
				deps,
				{ dryRun: false },
			),
		).rejects.toThrow("title");
		expect(deps.repository.deleteExported).not.toHaveBeenCalled();
	});
	test("a repeated source key does not create two records", async () => {
		const deps = setup();
		const result = await synchronizeContent(
			"notes",
			"owner",
			source(
				{ values: { title: "new", markdown: "body" } },
				{ values: { title: "new", markdown: "body" } },
			),
			deps,
			{ dryRun: false },
		);
		expect(result).toMatchObject({ insertedCount: 1, skippedCount: 1 });
		expect(deps.repository.save).toHaveBeenCalledTimes(1);
	});
	test("owner is used for list and deletion", async () => {
		const deps = setup([note("missing")]);
		await synchronizeContent("notes", "alice", source(), deps, {
			dryRun: false,
		});
		expect(deps.repository.list).toHaveBeenCalledWith("notes", "alice");
		expect(deps.repository.deleteExported).toHaveBeenCalledWith(
			"notes",
			"alice",
			"missing",
		);
	});
	test("shared image objects are protected when removing an exported reference", async () => {
		const deps = setup([
			{
				id: "id",
				key: "shared.png",
				status: "EXPORTED",
				values: {
					path: "shared.png",
					contentType: "image/png",
					fileSize: 1,
					width: 1,
					height: 1,
				},
			},
		]);
		vi.mocked(deps.repository.isMediaReferenced).mockResolvedValue(true);
		await synchronizeContent("images", "owner", source(), deps, {
			dryRun: false,
		});
		expect(deps.media.removeImage).not.toHaveBeenCalled();
	});
	test("missing cover preserves the stored book image path", async () => {
		const values = {
			isbn: "9781234567890",
			title: "Book",
			rating: 3,
			tags: [],
			markdown: "old",
			imagePath: "stored.png",
		};
		const deps = setup([
			{ id: "book-id", key: values.isbn, status: "UNEXPORTED", values },
		]);
		await synchronizeContent(
			"books",
			"owner",
			source({
				values: { ...values, markdown: "new", imagePath: null },
				preserveImagePath: true,
			}),
			deps,
			{ dryRun: false },
		);
		expect(deps.repository.save).toHaveBeenCalledWith(
			"owner",
			expect.objectContaining({
				id: "book-id",
				values: expect.objectContaining({
					markdown: "new",
					imagePath: "stored.png",
				}),
			}),
			false,
			now,
		);
		expect(deps.media.put).not.toHaveBeenCalled();
	});
	test("domain-invalid data aborts before writes and pruning", async () => {
		const deps = setup([note("missing")]);
		await expect(
			synchronizeContent(
				"notes",
				"owner",
				source({ values: { title: "", markdown: "body" } }),
				deps,
				{ dryRun: false },
			),
		).rejects.toThrow("required");
		expect(deps.repository.save).not.toHaveBeenCalled();
		expect(deps.repository.deleteExported).not.toHaveBeenCalled();
	});
});
