import type { MobileDomain } from "@s-hirano-ist/s-application/content/models";
import type { z } from "zod";
import {
	articleSchema,
	noteSchema,
	imageSchema,
	bookSchema,
} from "@s-hirano-ist/s-application/content/models";
export const importSchemas = {
	articles: articleSchema.pick({
		title: true,
		url: true,
		quote: true,
		categoryName: true,
		ogImageUrl: true,
		ogTitle: true,
		ogDescription: true,
	}),
	notes: noteSchema.pick({ title: true, markdown: true }),
	images: imageSchema.pick({
		path: true,
		contentType: true,
		fileSize: true,
		width: true,
		height: true,
	}),
	books: bookSchema.pick({
		isbn: true,
		title: true,
		markdown: true,
		imagePath: true,
		googleSubTitle: true,
		googleAuthors: true,
		googleDescription: true,
		googleImgSrc: true,
		googleHref: true,
		rating: true,
		tags: true,
	}),
};
export type ImportValuesByDomain = {
	[D in MobileDomain]: z.output<(typeof importSchemas)[D]>;
};
export type ImportChange = {
	[D in MobileDomain]: {
		domain: D;
		id: string;
		values: ImportValuesByDomain[D];
	};
}[MobileDomain];
export type ImportRecord = {
	id: string;
	key: string;
	status: "UNEXPORTED" | "LAST_UPDATED" | "EXPORTED";
	values: ImportValuesByDomain[MobileDomain];
};
export type PreparedImport = {
	media?: { path: string; bytes: Uint8Array };
	preserveImagePath?: boolean;
	values: unknown;
};
export type ImportRepository = {
	deleteExported(
		domain: MobileDomain,
		owner: string,
		id: string,
	): Promise<number>;
	isMediaReferenced(path: string): Promise<boolean>;
	list(domain: MobileDomain, owner: string): Promise<ImportRecord[]>;
	save(
		owner: string,
		change: ImportChange,
		creating: boolean,
		now: Date,
	): Promise<void>;
};
export type ImportMediaStore = {
	put(
		domain: "images" | "books",
		path: string,
		bytes: Uint8Array,
	): Promise<void>;
	removeImage(path: string): Promise<void>;
};
export function importKey(values: ImportValuesByDomain[MobileDomain]): string {
	if ("url" in values) return values.url;
	if ("isbn" in values) return values.isbn;
	if ("path" in values) return values.path;
	return values.title;
}
export function importChange(
	domain: MobileDomain,
	id: string,
	values: unknown,
): ImportChange {
	switch (domain) {
		case "articles":
			return { domain, id, values: importSchemas.articles.parse(values) };
		case "notes":
			return { domain, id, values: importSchemas.notes.parse(values) };
		case "images":
			return { domain, id, values: importSchemas.images.parse(values) };
		case "books":
			return { domain, id, values: importSchemas.books.parse(values) };
	}
	throw new Error("Unsupported content domain");
}
