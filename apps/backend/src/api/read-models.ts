import type * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import type {
	MobileDomain,
	SyncDomain,
} from "@s-hirano-ist/s-application/content/models";
import type {
	ReadModelByDomain,
	StoredSnapshot,
} from "@s-hirano-ist/s-application/content/models";
import type { z } from "zod";
type Dates = { createdAt: Date; exportedAt: Date | null; updatedAt: Date };
export type DtoByDomain = {
	articles: z.output<typeof schemas.articleSchema>;
	books: z.output<typeof schemas.bookSchema>;
	categories: z.output<typeof schemas.categorySchema>;
	images: z.output<typeof schemas.imageSchema>;
	notes: z.output<typeof schemas.noteSchema>;
};
function unreachable(value: never): never {
	throw new Error(`Unsupported read model: ${String(value)}`);
}
function contentBase(
	record: Dates & { id: string; status: DtoByDomain["notes"]["status"] },
) {
	return {
		id: record.id,
		status: record.status,
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
		exportedAt: record.exportedAt?.toISOString() ?? null,
	};
}
const dtoMappers: {
	[D in SyncDomain]: (record: ReadModelByDomain[D]) => DtoByDomain[D];
} = {
	articles: (record) => ({
		...contentBase(record),
		title: record.title,
		url: record.url,
		quote: record.quote,
		categoryId: record.categoryId,
		categoryName: record.categoryName,
		ogImageUrl: record.ogImageUrl,
		ogTitle: record.ogTitle,
		ogDescription: record.ogDescription,
	}),
	notes: (record) => ({
		...contentBase(record),
		title: record.title,
		markdown: record.markdown,
	}),
	images: (record) => ({
		...contentBase(record),
		path: record.path,
		contentType: record.contentType,
		fileSize: record.fileSize,
		width: record.width,
		height: record.height,
	}),
	books: (record) => ({
		...contentBase(record),
		isbn: record.isbn,
		title: record.title,
		markdown: record.markdown,
		imagePath: record.imagePath,
		googleSubTitle: record.googleSubTitle,
		googleAuthors: record.googleAuthors,
		googleDescription: record.googleDescription,
		googleImgSrc: record.googleImgSrc,
		googleHref: record.googleHref,
		rating: record.rating,
		tags: record.tags,
	}),
	categories: (record) => ({ id: record.id, name: record.name }),
};
export function toDto<D extends SyncDomain>(
	domain: D,
	record: ReadModelByDomain[D],
): DtoByDomain[D] {
	return dtoMappers[domain](record);
}
export function toSnapshot(
	value: StoredSnapshot,
): z.output<typeof schemas.snapshotRecordSchema> {
	switch (value.domain) {
		case "articles":
			return {
				domain: value.domain,
				record: toDto(value.domain, value.record),
			};
		case "notes":
			return {
				domain: value.domain,
				record: toDto(value.domain, value.record),
			};
		case "images":
			return {
				domain: value.domain,
				record: toDto(value.domain, value.record),
			};
		case "books":
			return {
				domain: value.domain,
				record: toDto(value.domain, value.record),
			};
		case "categories":
			return {
				domain: value.domain,
				record: toDto(value.domain, value.record),
			};
	}
	return unreachable(value);
}

const snapshotMappers: {
	[D in SyncDomain]: (
		record: ReadModelByDomain[D],
	) => Extract<z.output<typeof schemas.snapshotRecordSchema>, { domain: D }>;
} = {
	articles: (record) => ({
		domain: "articles",
		record: toDto("articles", record),
	}),
	notes: (record) => ({ domain: "notes", record: toDto("notes", record) }),
	images: (record) => ({ domain: "images", record: toDto("images", record) }),
	books: (record) => ({ domain: "books", record: toDto("books", record) }),
	categories: (record) => ({
		domain: "categories",
		record: toDto("categories", record),
	}),
};
export function snapshotDto<D extends SyncDomain>(
	domain: D,
	record: ReadModelByDomain[D],
) {
	return snapshotMappers[domain](record);
}
