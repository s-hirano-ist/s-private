import type { ZodType } from "zod";
import { createRoute, z } from "@hono/zod-openapi";
import {
	articleSchema,
	noteSchema,
	imageSchema,
	bookSchema,
	articleCreateSchema,
	noteCreateSchema,
	listQuerySchema,
	countQuerySchema,
	idSchema,
	createResultSchema,
	errorSchema,
	categorySchema,
	snapshotQuerySchema,
	snapshotPageSchema,
	changesQuerySchema,
	changesPageSchema,
	syncHeadSchema,
	uploadStartSchema,
	uploadSessionSchema,
	chunkResultSchema,
	searchQuerySchema,
	searchResponseSchema,
	subscriptionSchema,
	subscriptionEndpointSchema,
	sessionSchema,
} from "@s-hirano-ist/s-api-contracts/schemas";

export const jsonContent = <T extends ZodType>(schema: T) => ({
	"application/json": { schema },
});
export const errorResponses = {
	401: {
		description: "Authentication required",
		content: jsonContent(errorSchema),
	},
	403: { description: "Forbidden", content: jsonContent(errorSchema) },
	404: { description: "Not found", content: jsonContent(errorSchema) },
	409: { description: "Conflict", content: jsonContent(errorSchema) },
	410: { description: "Upload expired", content: jsonContent(errorSchema) },
	413: { description: "Payload too large", content: jsonContent(errorSchema) },
	422: { description: "Validation failed", content: jsonContent(errorSchema) },
	500: { description: "Internal error", content: jsonContent(errorSchema) },
	503: {
		description: "Service unavailable",
		content: jsonContent(errorSchema),
	},
};
const security: Record<string, string[]>[] = [
	{ bearerAuth: [] },
	{ sessionCookie: [] },
];
const idParams = z.object({ id: idSchema });
function contentRoutes<const D extends string, T extends ZodType>(
	domain: D,
	record: T,
) {
	const capitalized = domain[0].toUpperCase() + domain.slice(1);
	const page = z
		.object({
			data: z.array(record),
			totalCount: z.number().int().nonnegative(),
			offset: z.number().int().nonnegative(),
			limit: z.number().int().positive(),
		})
		.openapi(`${capitalized}Page`);
	return {
		list: createRoute({
			method: "get",
			path: `/${domain}`,
			operationId: `list${capitalized}`,
			tags: [domain],
			security,
			request: { query: listQuerySchema },
			responses: {
				200: { description: "Owner-scoped page", content: jsonContent(page) },
				...errorResponses,
			},
		}),
		count: createRoute({
			method: "get",
			path: `/${domain}/count`,
			operationId: `count${capitalized}`,
			tags: [domain],
			security,
			request: { query: countQuerySchema },
			responses: {
				200: {
					description: "Owner-scoped count",
					content: jsonContent(
						z
							.object({ count: z.number().int().nonnegative() })
							.openapi(`${capitalized}Count`),
					),
				},
				...errorResponses,
			},
		}),
		detail: createRoute({
			method: "get",
			path: `/${domain}/{id}`,
			operationId: `get${capitalized}`,
			tags: [domain],
			security,
			request: { params: idParams },
			responses: {
				200: {
					description: "Owner-scoped record",
					content: jsonContent(record),
				},
				...errorResponses,
			},
		}),
		delete: createRoute({
			method: "delete",
			path: `/${domain}/{id}`,
			operationId: `delete${capitalized}`,
			tags: [domain],
			security,
			request: { params: idParams },
			responses: {
				204: { description: "Deleted; only UNEXPORTED records may be deleted" },
				...errorResponses,
			},
		}),
	};
}
export const articlesRoutes = contentRoutes("articles", articleSchema);
export const notesRoutes = contentRoutes("notes", noteSchema);
export const imagesRoutes = contentRoutes("images", imageSchema);
export const booksRoutes = contentRoutes("books", bookSchema);
function createContentRoute<const D extends string, T extends ZodType>(
	domain: D,
	schema: T,
) {
	return createRoute({
		method: "post",
		path: `/${domain}`,
		operationId: `create${domain[0].toUpperCase()}${domain.slice(1)}`,
		tags: [domain],
		security,
		request: { body: { required: true, content: jsonContent(schema) } },
		responses: {
			201: {
				description:
					"Durable result; retry the same operationId only with identical input",
				content: jsonContent(createResultSchema),
			},
			...errorResponses,
		},
	});
}
export const bookByIsbnRoute = createRoute({
	method: "get",
	path: "/books/isbn/{isbn}",
	operationId: "getBookByIsbn",
	tags: ["books"],
	security,
	request: { params: z.object({ isbn: idSchema }) },
	responses: {
		200: {
			description: "Owner-scoped book by ISBN",
			content: jsonContent(bookSchema),
		},
		...errorResponses,
	},
});
export const noteByTitleRoute = createRoute({
	method: "get",
	path: "/notes/title/{title}",
	operationId: "getNoteByTitle",
	tags: ["notes"],
	security,
	request: { params: z.object({ title: idSchema }) },
	responses: {
		200: {
			description: "Owner-scoped note by title",
			content: jsonContent(noteSchema),
		},
		...errorResponses,
	},
});
export const createArticleRoute = createContentRoute(
	"articles",
	articleCreateSchema,
);
export const createNoteRoute = createContentRoute("notes", noteCreateSchema);
export const categoriesRoute = createRoute({
	method: "get",
	path: "/categories",
	operationId: "listCategories",
	tags: ["categories"],
	security,
	responses: {
		200: {
			description: "Owner-scoped categories",
			content: jsonContent(
				z
					.object({ data: z.array(categorySchema) })
					.openapi("CategoriesResponse"),
			),
		},
		...errorResponses,
	},
});
export const syncHeadRoute = createRoute({
	method: "get",
	path: "/sync/head",
	operationId: "getSyncHead",
	tags: ["sync"],
	security,
	responses: {
		200: {
			description: "Owner-bound opaque cursor",
			content: jsonContent(syncHeadSchema),
		},
		...errorResponses,
	},
});
export const syncSnapshotRoute = createRoute({
	method: "get",
	path: "/sync/snapshot",
	operationId: "listSyncSnapshot",
	tags: ["sync"],
	security,
	request: { query: snapshotQuerySchema },
	responses: {
		200: {
			description: "Keyset page; replay changes after completing the snapshot",
			content: jsonContent(snapshotPageSchema),
		},
		...errorResponses,
	},
});
export const syncChangesRoute = createRoute({
	method: "get",
	path: "/sync/changes",
	operationId: "listSyncChanges",
	tags: ["sync"],
	security,
	request: { query: changesQuerySchema },
	responses: {
		200: {
			description: "Ordered changes; persist records and nextCursor together",
			content: jsonContent(changesPageSchema),
		},
		...errorResponses,
	},
});
export const searchRoute = createRoute({
	method: "get",
	path: "/search",
	operationId: "searchContent",
	tags: ["search"],
	security,
	request: { query: searchQuerySchema },
	responses: {
		200: {
			description: "Owner-scoped search results",
			content: jsonContent(searchResponseSchema),
		},
		...errorResponses,
	},
});
export const startUploadRoute = createRoute({
	method: "post",
	path: "/uploads",
	operationId: "startUpload",
	tags: ["uploads"],
	security,
	request: {
		body: { required: true, content: jsonContent(uploadStartSchema) },
	},
	responses: {
		200: {
			description: "Created or resumed upload",
			content: jsonContent(uploadSessionSchema),
		},
		...errorResponses,
	},
});
export const getUploadRoute = createRoute({
	method: "get",
	path: "/uploads/{id}",
	operationId: "getUpload",
	tags: ["uploads"],
	security,
	request: { params: idParams },
	responses: {
		200: {
			description: "Upload status",
			content: jsonContent(uploadSessionSchema),
		},
		...errorResponses,
	},
});
export const cancelUploadRoute = createRoute({
	method: "delete",
	path: "/uploads/{id}",
	operationId: "cancelUpload",
	tags: ["uploads"],
	security,
	request: { params: idParams },
	responses: { 204: { description: "Cancelled" }, ...errorResponses },
});
export const putChunkRoute = createRoute({
	method: "put",
	path: "/uploads/{id}/chunks/{part}",
	operationId: "putUploadChunk",
	tags: ["uploads"],
	security,
	request: {
		params: z.object({
			id: idSchema,
			part: z.coerce
				.number()
				.int()
				.nonnegative()
				.openapi({
					type: "integer",
					param: { name: "part", in: "path", required: true },
				}),
		}),
		body: {
			required: true,
			content: {
				"application/octet-stream": {
					schema: z.string().openapi({ type: "string", format: "binary" }),
				},
			},
		},
	},
	responses: {
		200: {
			description: "Chunk received",
			content: jsonContent(chunkResultSchema),
		},
		...errorResponses,
	},
});
export const completeUploadRoute = createRoute({
	method: "post",
	path: "/uploads/{id}/complete",
	operationId: "completeUpload",
	tags: ["uploads"],
	security,
	request: { params: idParams },
	responses: {
		201: {
			description: "Durable created resource",
			content: jsonContent(createResultSchema),
		},
		...errorResponses,
	},
});
export const mediaRoute = createRoute({
	method: "get",
	path: "/media/{domain}/{id}/{variant}",
	operationId: "getMedia",
	tags: ["media"],
	security,
	request: {
		params: z.object({
			domain: z.enum(["images", "books"]),
			id: idSchema,
			variant: z.enum(["original", "thumbnail"]),
		}),
	},
	responses: {
		200: {
			description: "Owner-scoped image stream",
			content: {
				"application/octet-stream": {
					schema: z.string().openapi({ type: "string", format: "binary" }),
				},
				"image/jpeg": {
					schema: z.string().openapi({ type: "string", format: "binary" }),
				},
				"image/png": {
					schema: z.string().openapi({ type: "string", format: "binary" }),
				},
				"image/webp": {
					schema: z.string().openapi({ type: "string", format: "binary" }),
				},
			},
		},
		...errorResponses,
	},
});
export const sessionRoute = createRoute({
	method: "get",
	path: "/session",
	operationId: "getSession",
	tags: ["session"],
	security: [{ sessionCookie: [] }],
	responses: {
		200: {
			description: "Authenticated Web session",
			content: jsonContent(sessionSchema),
		},
		...errorResponses,
	},
});
export const subscribeRoute = createRoute({
	method: "post",
	path: "/push/subscriptions",
	operationId: "subscribeToPush",
	tags: ["push"],
	security,
	request: {
		body: { required: true, content: jsonContent(subscriptionSchema) },
	},
	responses: { 204: { description: "Subscribed" }, ...errorResponses },
});
export const unsubscribeRoute = createRoute({
	method: "delete",
	path: "/push/subscriptions",
	operationId: "unsubscribeFromPush",
	tags: ["push"],
	security,
	request: {
		body: { required: true, content: jsonContent(subscriptionEndpointSchema) },
	},
	responses: { 204: { description: "Unsubscribed" }, ...errorResponses },
});
export const testPushRoute = createRoute({
	method: "post",
	path: "/push/test",
	operationId: "sendTestPush",
	tags: ["push"],
	security,
	request: {
		body: { required: true, content: jsonContent(subscriptionEndpointSchema) },
	},
	responses: { 204: { description: "Sent" }, ...errorResponses },
});
export const apiRoutes = [
	bookByIsbnRoute,
	noteByTitleRoute,
	...Object.values(articlesRoutes),
	...Object.values(notesRoutes),
	...Object.values(imagesRoutes),
	...Object.values(booksRoutes),
	createArticleRoute,
	createNoteRoute,
	categoriesRoute,
	syncHeadRoute,
	syncSnapshotRoute,
	syncChangesRoute,
	searchRoute,
	startUploadRoute,
	getUploadRoute,
	cancelUploadRoute,
	putChunkRoute,
	completeUploadRoute,
	mediaRoute,
	sessionRoute,
	subscribeRoute,
	unsubscribeRoute,
	testPushRoute,
];
