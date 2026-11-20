// @vitest-environment node
import { importBatches, readImportFile } from "@/components/rss/import-file";
import { strToU8, zipSync } from "fflate";
import { expect, test } from "vitest";
test("extracts subscriptions and starred links from an Inoreader ZIP, ignoring bodies and other files", async () => {
	const archive = zipSync({
		"archive/subscriptions.xml": strToU8("<opml><body/></opml>"),
		"archive/starred.json": strToU8(
			JSON.stringify({
				items: [
					{
						title: "Saved",
						canonical: [{ href: "https://example.com/one" }],
						summary: { content: "DO_NOT_SEND" },
						content: "DO_NOT_SEND",
					},
				],
			}),
		),
		"notes.json": strToU8("ignore me"),
	});
	const files = await readImportFile(new File([archive], "inoreader.zip"));
	expect(files.map((file) => file.kind).toSorted()).toEqual([
		"opml",
		"starred",
	]);
	const batches = importBatches(files);
	expect(batches).toHaveLength(2);
	expect(JSON.stringify(batches)).not.toContain("DO_NOT_SEND");
});
test("large saved exports use metadata batches of at most 100 and preserve invalid rows for reporting", () => {
	const items = Array.from({ length: 201 }, () => ({
		title: "Saved",
		url: "https://example.com/one",
		summary: { content: "body" },
	}));
	const batches = importBatches([
		{ kind: "starred", content: JSON.stringify({ items: [...items, null] }) },
	]);
	expect(
		batches.map(
			(batch) =>
				(JSON.parse(batch.content) as { items: unknown[] }).items.length,
		),
	).toEqual([100, 100, 2]);
	expect(JSON.stringify(batches)).not.toContain("summary");
});
test("rejects unrelated ZIP files and unknown JSON export shapes", async () => {
	await expect(
		readImportFile(
			new File([zipSync({ "notes.json": strToU8("{}") })], "archive.zip"),
		),
	).rejects.toThrow("No subscriptions.xml or starred.json");
	expect(() => importBatches([{ kind: "starred", content: "{}" }])).toThrow(
		"Invalid starred.json",
	);
});
test("rejects an archive whose selected content exceeds the expansion limit", async () => {
	const archive = zipSync(
		{ "starred.json": new Uint8Array(33 * 1024 * 1024) },
		{ level: 0 },
	);
	await expect(
		readImportFile(new File([archive], "too-large.zip")),
	).rejects.toThrow("Expanded import too large");
});
