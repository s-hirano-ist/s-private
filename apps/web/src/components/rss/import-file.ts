import { Unzip, UnzipInflate } from "fflate";
const MAX_FILE = 50 * 1024 * 1024;
const MAX_EXPANDED = 32 * 1024 * 1024;
export type ImportFile = { content: string; kind: "opml" | "starred" };
function kindFor(name: string): ImportFile["kind"] | null {
	const base = name.split("/").at(-1)?.toLowerCase();
	if (base === "subscriptions.xml" || base?.endsWith(".opml")) return "opml";
	if (base === "starred.json") return "starred";
	return null;
}
/** ZIP parsing stays in the browser: only metadata batches cross the HTTP boundary. */
export async function readImportFile(file: File): Promise<ImportFile[]> {
	if (file.size > MAX_FILE) throw new Error("Import file too large");
	if (!file.name.toLowerCase().endsWith(".zip")) {
		const kind =
			kindFor(file.name) ??
			(file.name.toLowerCase().endsWith(".xml") ? "opml" : null);
		if (!kind) throw new Error("Expected Inoreader ZIP, OPML, or starred.json");
		if (file.size > MAX_EXPANDED) throw new Error("Import too large");
		return [{ kind, content: await file.text() }];
	}
	const results: ImportFile[] = [];
	let expanded = 0;
	let failure: Error | undefined;
	let files = 0;
	const unzip = new Unzip((entry) => {
		files++;
		if (files > 10000) {
			failure = new Error("Too many archive entries");
			throw failure;
		}
		const kind = kindFor(entry.name);
		if (!kind) return;
		if ((entry.originalSize ?? 0) + expanded > MAX_EXPANDED) {
			failure = new Error("Expanded import too large");
			throw failure;
		}
		const chunks: Uint8Array[] = [];
		let size = 0;
		entry.ondata = (error, data, final) => {
			if (error) {
				failure = error;
				return;
			}
			size += data.length;
			expanded += data.length;
			if (expanded > MAX_EXPANDED) {
				entry.terminate();
				failure = new Error("Expanded import too large");
				throw failure;
			}
			chunks.push(data);
			if (final) {
				const bytes = new Uint8Array(size);
				let offset = 0;
				for (const chunk of chunks) {
					bytes.set(chunk, offset);
					offset += chunk.length;
				}
				results.push({ kind, content: new TextDecoder().decode(bytes) });
			}
		};
		entry.start();
	});
	unzip.register(UnzipInflate);
	const reader = file.stream().getReader();
	try {
		for (;;) {
			const part = await reader.read();
			if (part.done) {
				unzip.push(new Uint8Array(), true);
				break;
			}
			unzip.push(part.value);
			if (failure) throw failure;
		}
	} finally {
		await reader.cancel();
		reader.releaseLock();
	}
	if (failure) throw failure;
	if (results.length === 0)
		throw new Error("No subscriptions.xml or starred.json in archive");
	return results;
}
export function importBatches(files: ImportFile[]): ImportFile[] {
	const batches: ImportFile[] = [];
	for (const file of files) {
		if (file.kind === "opml") {
			batches.push(file);
			continue;
		}
		const root: unknown = JSON.parse(file.content);
		let items: unknown = root;
		if (
			!Array.isArray(root) &&
			typeof root === "object" &&
			root !== null &&
			"items" in root
		)
			items = root.items;
		if (!Array.isArray(items)) throw new TypeError("Invalid starred.json");
		for (let offset = 0; offset < items.length; offset += 100) {
			// Strip full article bodies before sending or persisting an export.
			const entries = items.slice(offset, offset + 100).map((item: unknown) => {
				if (typeof item !== "object" || item === null) return null;
				const fields = item as Record<string, unknown>;
				return {
					title: fields.title,
					canonical: fields.canonical,
					alternate: fields.alternate,
					url: fields.url,
					published: fields.published,
				};
			});
			batches.push({
				kind: "starred",
				content: JSON.stringify({ items: entries }),
			});
		}
	}
	return batches;
}
