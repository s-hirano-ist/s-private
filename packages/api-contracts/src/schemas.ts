import { z } from "@hono/zod-openapi";

export const contentDomainSchema = z
	.enum(["articles", "notes", "images", "books"])
	.openapi("ContentDomain");
export const syncDomainSchema = z
	.enum(["articles", "notes", "images", "books", "categories"])
	.openapi("SyncDomain");
export const statusSchema = z
	.enum(["UNEXPORTED", "LAST_UPDATED", "EXPORTED"])
	.openapi("ContentStatus");
const timestamp = z.iso.datetime({ offset: true });
export const idSchema = z.string().min(1).max(512);
export const operationIdSchema = z.uuid();
export const errorSchema = z
	.object({
		error: z.object({
			code: z.enum([
				"UNAUTHORIZED",
				"FORBIDDEN",
				"NOT_FOUND",
				"VALIDATION_ERROR",
				"DUPLICATE",
				"NOT_DELETABLE",
				"UPLOAD_TOO_LARGE",
				"OPERATION_CONFLICT",
				"OPERATION_IN_PROGRESS",
				"INVALID_CHUNK_SIZE",
				"UPLOAD_INCOMPLETE",
				"UPLOAD_EXPIRED",
				"INVALID_SYNC_CURSOR",
				"API_UNAVAILABLE",
				"INTERNAL_ERROR",
			]),
		}),
	})
	.openapi("ApiError");
const contentBase = {
	id: idSchema,
	status: statusSchema,
	createdAt: timestamp,
	updatedAt: timestamp,
	exportedAt: timestamp.nullable(),
};
export const articleSchema = z
	.object({
		...contentBase,
		title: z.string(),
		url: z.url(),
		quote: z.string().nullable(),
		categoryId: idSchema,
		categoryName: z.string(),
		ogImageUrl: z.string().nullable().optional(),
		ogTitle: z.string().nullable().optional(),
		ogDescription: z.string().nullable().optional(),
	})
	.openapi("Article");
export const noteSchema = z
	.object({ ...contentBase, title: z.string(), markdown: z.string() })
	.openapi("Note");
export const imageSchema = z
	.object({
		...contentBase,
		path: z.string(),
		contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
		fileSize: z.number().int().nonnegative().nullable(),
		width: z.number().int().positive().nullable(),
		height: z.number().int().positive().nullable(),
	})
	.openapi("Image");
export const bookSchema = z
	.object({
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
	})
	.openapi("Book");
export const categorySchema = z
	.object({ id: idSchema, name: z.string() })
	.openapi("Category");
export const articleCreateSchema = z
	.strictObject({
		operationId: operationIdSchema,
		title: z.string().min(1),
		url: z.url(),
		category: z.string().min(1),
		quote: z.string().optional(),
	})
	.openapi("ArticleCreate");
export const noteCreateSchema = z
	.strictObject({
		operationId: operationIdSchema,
		title: z.string().min(1),
		markdown: z.string(),
	})
	.openapi("NoteCreate");
export const listQuerySchema = z.object({
	status: statusSchema.optional(),
	offset: z.coerce
		.number()
		.int()
		.min(0)
		.default(0)
		.openapi({ type: "integer" }),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.default(30)
		.openapi({ type: "integer" }),
});
export const countQuerySchema = z.object({ status: statusSchema.optional() });
export const resourceSchema = z
	.object({ id: idSchema, type: contentDomainSchema })
	.openapi("ResourceReference");
export const createResultSchema = z
	.object({
		accepted: z.literal(true),
		operationId: operationIdSchema,
		resource: resourceSchema,
	})
	.openapi("CreateResult");

// The discriminator is outside the record so persisted domain records stay unchanged.
const articleSnapshot = z
	.object({ domain: z.literal("articles"), record: articleSchema })
	.openapi("ArticleSnapshot");
const noteSnapshot = z
	.object({ domain: z.literal("notes"), record: noteSchema })
	.openapi("NoteSnapshot");
const imageSnapshot = z
	.object({ domain: z.literal("images"), record: imageSchema })
	.openapi("ImageSnapshot");
const bookSnapshot = z
	.object({ domain: z.literal("books"), record: bookSchema })
	.openapi("BookSnapshot");
const categorySnapshot = z
	.object({ domain: z.literal("categories"), record: categorySchema })
	.openapi("CategorySnapshot");
export const snapshotRecordSchema = z
	.discriminatedUnion("domain", [
		articleSnapshot,
		noteSnapshot,
		imageSnapshot,
		bookSnapshot,
		categorySnapshot,
	])
	.openapi("SnapshotRecord");
const changeBase = { id: idSchema, version: z.string().regex(/^\d+$/u) };
// Separate action and domain discriminators avoid ambiguous optional record fields.
export const syncChangeSchema = z
	.discriminatedUnion("action", [
		z
			.object({
				...changeBase,
				action: z.literal("delete"),
				domain: syncDomainSchema,
			})
			.openapi("SyncDelete"),
		z
			.object({
				...changeBase,
				action: z.literal("upsert"),
				value: snapshotRecordSchema,
			})
			.openapi("SyncUpsert"),
	])
	.openapi("SyncChange");
export const snapshotQuerySchema = z.object({
	domain: syncDomainSchema,
	after: z.string().max(512).default(""),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.default(100)
		.openapi({ type: "integer" }),
});
export const snapshotPageSchema = z
	.object({
		data: z.array(snapshotRecordSchema),
		nextAfter: z.string().nullable(),
	})
	.openapi("SnapshotPage");
export const changesQuerySchema = z.object({
	cursor: z.string().min(1).max(512),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.default(100)
		.openapi({ type: "integer" }),
});
export const changesPageSchema = z
	.object({
		data: z.array(syncChangeSchema),
		nextCursor: z.string(),
		hasMore: z.boolean(),
	})
	.openapi("ChangesPage");
export const syncHeadSchema = z
	.object({ cursor: z.string() })
	.openapi("SyncHead");

export const uploadChunkSize = 1024 * 1024;
export const uploadLimit = 10 * 1024 * 1024;
const uploadBase = {
	operationId: operationIdSchema,
	contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
	fileSize: z.number().int().positive().max(uploadLimit),
};
const imageUploadSchema = z
	.strictObject({
		...uploadBase,
		domain: z.literal("images"),
		metadata: z.strictObject({ filename: z.string().min(1) }),
	})
	.openapi("ImageUploadStart");
const bookUploadSchema = z
	.strictObject({
		...uploadBase,
		domain: z.literal("books"),
		metadata: z.strictObject({
			isbn: z.string().min(1),
			title: z.string().min(1),
			rating: z.number().int(),
			tags: z.array(z.string()),
		}),
	})
	.openapi("BookUploadStart");
export const uploadStartSchema = z
	.discriminatedUnion("domain", [imageUploadSchema, bookUploadSchema])
	.openapi("UploadStart");
export const uploadSessionSchema = z
	.object({
		uploadId: idSchema,
		operationId: operationIdSchema,
		chunkSize: z.literal(uploadChunkSize),
		receivedParts: z.array(z.number().int().nonnegative()),
		expiresAt: timestamp,
	})
	.openapi("UploadSession");
export const chunkResultSchema = z
	.object({ accepted: z.literal(true), part: z.number().int().nonnegative() })
	.openapi("ChunkResult");
export const searchQuerySchema = z.object({
	query: z.string().trim().min(1).max(500),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(50)
		.default(20)
		.openapi({ type: "integer" }),
});
const searchHitBase = { id: idSchema, title: z.string(), snippet: z.string() };
export const searchHitSchema = z
	.discriminatedUnion("type", [
		z
			.object({
				...searchHitBase,
				type: z.literal("articles"),
				url: z.url(),
				category: categorySchema,
			})
			.openapi("ArticleSearchHit"),
		z
			.object({ ...searchHitBase, type: z.literal("notes") })
			.openapi("NoteSearchHit"),
		z
			.object({
				...searchHitBase,
				type: z.literal("books"),
				isbn: z.string(),
				rating: z.number().int(),
				tags: z.array(z.string()),
			})
			.openapi("BookSearchHit"),
	])
	.openapi("SearchHit");
export const searchResponseSchema = z
	.object({ query: z.string(), data: z.array(searchHitSchema) })
	.openapi("SearchResponse");
export const subscriptionSchema = z
	.strictObject({
		endpoint: z.url(),
		keys: z.strictObject({
			auth: z.string().min(1),
			p256dh: z.string().min(1),
		}),
	})
	.openapi("PushSubscription");
export const subscriptionEndpointSchema = z
	.strictObject({ endpoint: z.url() })
	.openapi("PushSubscriptionEndpoint");
export const sessionSchema = z
	.object({
		user: z.object({
			id: idSchema,
			name: z.string(),
			email: z.email(),
			image: z.url().nullable(),
		}),
		expiresAt: timestamp,
	})
	.openapi("Session");
