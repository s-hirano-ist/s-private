import type {
	ImportChange,
	ImportRecord,
	ImportRepository,
	ImportMediaStore,
	PreparedImport,
} from "@s-hirano-ist/s-application/batch/import-models";
import type { Clock } from "@s-hirano-ist/s-application/clock";
import type { MobileDomain } from "@s-hirano-ist/s-application/content/models";
import {
	importChange,
	importKey,
} from "@s-hirano-ist/s-application/batch/import-models";
import { validateImport } from "@s-hirano-ist/s-application/batch/validate-import";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { makeId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
export type ImportProgress = {
	action: "inserted" | "updated" | "skipped" | "deleted";
	key: string;
};
type Dependencies = {
	clock: Clock;
	media?: ImportMediaStore;
	repository: ImportRepository;
};
type Options = {
	dryRun: boolean;
	onProgress?: (event: ImportProgress) => void;
};
function preserveCover(
	change: ImportChange,
	item: PreparedImport,
	previous: ImportRecord | undefined,
): ImportChange {
	if (
		item.preserveImagePath &&
		change.domain === "books" &&
		previous &&
		"imagePath" in previous.values
	)
		return {
			...change,
			values: { ...change.values, imagePath: previous.values.imagePath },
		};
	return change;
}
async function saveItem(
	owner: string,
	change: ImportChange,
	item: PreparedImport,
	creating: boolean,
	deps: Dependencies,
) {
	if (item.media && (change.domain === "images" || change.domain === "books")) {
		if (!deps.media) throw new ApplicationError("UNAVAILABLE");
		await deps.media.put(change.domain, item.media.path, item.media.bytes);
	}
	await deps.repository.save(owner, change, creating, deps.clock.now());
}
async function prune(
	domain: MobileDomain,
	owner: string,
	records: ImportRecord[],
	present: Set<string>,
	deps: Dependencies,
	options: Options,
) {
	let deletedCount = 0;
	for (const record of records) {
		if (record.status !== "EXPORTED" || present.has(record.key)) continue;
		const count = options.dryRun
			? 1
			: await deps.repository.deleteExported(domain, owner, record.id);
		if (
			count &&
			!options.dryRun &&
			domain === "images" &&
			deps.media &&
			!(await deps.repository.isMediaReferenced(record.key))
		)
			await deps.media.removeImage(record.key);
		deletedCount += count;
		if (count) options.onProgress?.({ action: "deleted", key: record.key });
	}
	return deletedCount;
}
export async function synchronizeContent(
	domain: MobileDomain,
	owner: string,
	source: AsyncIterable<PreparedImport>,
	deps: Dependencies,
	options: Options,
) {
	const records = await deps.repository.list(domain, owner);
	const existing = new Map(records.map((record) => [record.key, record]));
	const present = new Set<string>();
	const summary = {
		insertedCount: 0,
		updatedCount: 0,
		skippedCount: 0,
		deletedCount: 0,
	};
	// A source failure aborts before pruning; a partial source must never authorize deletions.
	for await (const item of source) {
		let change = importChange(domain, "", item.values);
		validateImport(change);
		const key = importKey(change.values);
		present.add(key);
		const previous = existing.get(key);
		change = preserveCover(change, item, previous);
		// Imported image identity is its immutable source path.
		if (
			previous &&
			(domain === "images" ||
				JSON.stringify(previous.values) === JSON.stringify(change.values))
		) {
			summary.skippedCount++;
			options.onProgress?.({ action: "skipped", key });
			continue;
		}
		change = { ...change, id: previous?.id ?? makeId() };
		if (!options.dryRun) await saveItem(owner, change, item, !previous, deps);
		existing.set(key, {
			id: change.id,
			key,
			status: previous?.status ?? "EXPORTED",
			values: change.values,
		});
		if (previous) summary.updatedCount++;
		else summary.insertedCount++;
		options.onProgress?.({ action: previous ? "updated" : "inserted", key });
	}
	summary.deletedCount = await prune(
		domain,
		owner,
		records,
		present,
		deps,
		options,
	);
	return summary;
}
