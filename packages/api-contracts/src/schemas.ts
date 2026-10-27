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
export const operationIdSchema = z.uuid().openapi({
	description:
		"Client-generated UUID. Reuse it only with identical input when retrying a creation.",
	example: "6ab4a998-177a-4a34-ae38-9f5e75a05b2c",
});
// Validate normalized values without transforming the wire input before operation hashing.
export const categoryInputSchema = z
	.string()
	.refine((value) => value.trim().length > 0 && value.trim().length <= 16)
	.openapi({
		description:
			"Category name: 1–16 UTF-16 code units after trimming. The original input is retained for idempotency hashing.",
		example: "Technology",
		pattern: "^\\s*\\S(?:[\\s\\S]{0,14}\\S)?\\s*$",
	});
export const isbnInputSchema = z
	.string()
	.regex(/^(?:-*\d){13}-*$/u)
	.openapi({
		description:
			"Exactly 13 digits after removing ASCII hyphens. ISBN-10 is not supported. Normalization occurs in the domain layer after operation hashing.",
		example: "978-4-06-521234-5",
		pattern: "^(?:-*\\d){13}-*$",
	});
export const bookTagsInputSchema = z
	.array(
		z
			.string()
			.refine((value) => value.trim().length <= 64)
			.openapi({ pattern: "^\\s*(?:\\S(?:[\\s\\S]{0,62}\\S)?)?\\s*$" }),
	)
	.openapi({
		description:
			"Tags are trimmed and empty tags removed in the domain layer. Each remaining tag must contain 1–64 UTF-16 code units. Input is retained for idempotency hashing.",
		example: ["TypeScript"],
	});
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
		title: z
			.string()
			.min(1)
			.max(128)
			.openapi({ example: "TypeScript handbook" }),
		url: z
			.url()
			.max(1024)
			.regex(/^https?:\/\//iu)
			.openapi({
				description: "HTTP or HTTPS URL, at most 1024 UTF-16 code units.",
				pattern: "^[hH][tT][tT][pP][sS]?://",
				format: "uri",
				example: "https://example.com/article",
			}),
		category: categoryInputSchema,
		quote: z.string().max(512).optional(),
	})
	.openapi("ArticleCreate");
export const noteCreateSchema = z
	.strictObject({
		operationId: operationIdSchema,
		title: z.string().min(1).max(64).openapi({ example: "Meeting notes" }),
		markdown: z
			.string()
			.min(1)
			.openapi({ example: "# Notes\nMeeting summary" }),
	})
	.openapi("NoteCreate");
// Zod coercion needs an explicit OpenAPI type; retain bounds/default from the same values.
function integerQuery(minimum: number, maximum: number, defaultValue: number) {
	return z.coerce
		.number()
		.int()
		.min(minimum)
		.max(maximum)
		.default(defaultValue)
		.openapi({ type: "integer", minimum, maximum, default: defaultValue });
}
export const listQuerySchema = z.object({
	status: statusSchema.optional(),
	offset: integerQuery(0, 10000, 0),
	limit: integerQuery(1, 100, 30),
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
const changeBase = {
	id: idSchema,
	version: z.string().regex(/^\d+$/u).openapi({ pattern: "^\\d+$" }),
};
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
	after: z.string().max(512).default("").openapi({
		description: "Last record ID from nextAfter; omit for the first page.",
		example: "record-id",
	}),
	limit: integerQuery(1, 100, 100),
});
export const snapshotPageSchema = z
	.object({
		data: z.array(snapshotRecordSchema),
		nextAfter: z.string().nullable(),
	})
	.openapi("SnapshotPage");
export const changesQuerySchema = z.object({
	cursor: z.string().min(1).max(512).openapi({
		description:
			"Opaque owner-bound cursor returned by sync head or changes. Do not construct or edit it.",
	}),
	limit: integerQuery(1, 100, 100),
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
			filename: z.string().min(1).optional(),
			isbn: isbnInputSchema,
			title: z.string().min(1).max(512),
			rating: z.number().int().min(1).max(5),
			tags: bookTagsInputSchema,
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
		chunkSize: z
			.literal(uploadChunkSize)
			.openapi({ type: "integer", enum: [uploadChunkSize] }),
		receivedParts: z.array(z.number().int().nonnegative()),
		expiresAt: timestamp,
	})
	.openapi("UploadSession");
export const chunkResultSchema = z
	.object({ accepted: z.literal(true), part: z.number().int().nonnegative() })
	.openapi("ChunkResult");
export const searchQuerySchema = z.object({
	query: z.string().trim().min(1).max(500),
	limit: integerQuery(1, 50, 20),
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
