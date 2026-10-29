import { z } from "zod";
export const contentDomainSchema = z.enum([
	"articles",
	"notes",
	"images",
	"books",
]);
export const syncDomainSchema = z.enum([
	"articles",
	"notes",
	"images",
	"books",
	"categories",
]);
export const statusSchema = z.enum(["UNEXPORTED", "LAST_UPDATED", "EXPORTED"]);
const idSchema = z.string().min(1).max(512);
export type MobileDomain = z.output<typeof contentDomainSchema>;
export type SyncDomain = z.output<typeof syncDomainSchema>;
const contentBase = {
	id: idSchema,
	status: statusSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
	exportedAt: z.date().nullable(),
};
export const articleSchema = z.object({
	...contentBase,
	title: z.string(),
	url: z.url(),
	quote: z.string().nullable(),
	categoryId: idSchema,
	categoryName: z.string(),
	ogImageUrl: z.string().nullable().optional(),
	ogTitle: z.string().nullable().optional(),
	ogDescription: z.string().nullable().optional(),
});
export const noteSchema = z.object({
	...contentBase,
	title: z.string(),
	markdown: z.string(),
});
export const imageSchema = z.object({
	...contentBase,
	path: z.string(),
	contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
	fileSize: z.number().int().nonnegative().nullable(),
	width: z.number().int().positive().nullable(),
	height: z.number().int().positive().nullable(),
});
export const bookSchema = z.object({
	...contentBase,
	isbn: z.string(),
	title: z.string(),
	markdown: z.string().nullable(),
	imagePath: z.string().nullable(),
	googleSubTitle: z.string().nullable().optional(),
	googleAuthors: z.array(z.string()).optional(),
	googleDescription: z.string().nullable().optional(),
	googleImgSrc: z.string().nullable().optional(),
	googleHref: z.string().nullable().optional(),
	rating: z.number().int(),
	tags: z.array(z.string()),
});
export const categorySchema = z.object({ id: idSchema, name: z.string() });

export type ReadModelByDomain = {
	articles: z.output<typeof articleSchema>;
	books: z.output<typeof bookSchema>;
	categories: z.output<typeof categorySchema>;
	images: z.output<typeof imageSchema>;
	notes: z.output<typeof noteSchema>;
};
export type StoredSnapshot = {
	[D in SyncDomain]: { domain: D; record: ReadModelByDomain[D] };
}[SyncDomain];
export type SnapshotQuery = {
	after: string;
	domain: SyncDomain;
	limit: number;
};
export type ChangesQuery = { cursor: string; limit: number };
