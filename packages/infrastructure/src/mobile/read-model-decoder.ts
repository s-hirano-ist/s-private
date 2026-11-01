import type {
	ReadModelByDomain,
	StoredSnapshot,
	SyncDomain,
} from "@s-hirano-ist/s-application/content/models";
import type { z } from "zod";
import {
	articleSchema,
	noteSchema,
	imageSchema,
	bookSchema,
	categorySchema,
} from "@s-hirano-ist/s-application/content/models";
const readSchemas: { [D in SyncDomain]: z.ZodType<ReadModelByDomain[D]> } = {
	articles: articleSchema,
	notes: noteSchema,
	images: imageSchema,
	books: bookSchema,
	categories: categorySchema,
};
export function parseReadModel<D extends SyncDomain>(
	domain: D,
	value: unknown,
): ReadModelByDomain[D] {
	return readSchemas[domain].parse(value);
}
export function parseStoredSnapshot(
	domain: SyncDomain,
	value: unknown,
): StoredSnapshot {
	switch (domain) {
		case "articles":
			return { domain, record: parseReadModel(domain, value) };
		case "notes":
			return { domain, record: parseReadModel(domain, value) };
		case "images":
			return { domain, record: parseReadModel(domain, value) };
		case "books":
			return { domain, record: parseReadModel(domain, value) };
		case "categories":
			return { domain, record: parseReadModel(domain, value) };
	}
	throw new Error("Unsupported read model");
}
