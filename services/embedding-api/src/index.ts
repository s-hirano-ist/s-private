import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { RAG_CONFIG } from "@s-hirano-ist/s-search/config";
import {
	embed,
	embedBatch,
	initEmbeddingPipeline,
	isEmbeddingReady,
} from "@s-hirano-ist/s-search/embedding";
import { logger } from "hono/logger";
import { z } from "zod";

const app = new OpenAPIHono();

// --- Access log middleware ---
app.use(logger());

// --- Bearer token auth middleware ---
const PUBLIC_PATHS = ["/health", "/doc", "/ui"];

app.use("/*", async (c, next) => {
	if (PUBLIC_PATHS.some((p) => c.req.path.startsWith(p))) return next();

	const token = c.req.header("Authorization")?.replace("Bearer ", "");
	if (!token || token !== process.env.API_KEY) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	await next();
});

// --- Schemas ---
const embedRequestSchema = z.object({
	text: z.string().min(1),
	isQuery: z.boolean().optional().default(false),
});

const embedResponseSchema = z.object({
	vector: z.array(z.number()),
	dimensions: z.number(),
});

const embedBatchRequestSchema = z.object({
	texts: z.array(z.string().min(1)).min(1),
	isQuery: z.boolean().optional().default(false),
});

const embedBatchResponseSchema = z.object({
	vectors: z.array(z.array(z.number())),
	dimensions: z.number(),
});

const healthResponseSchema = z.object({
	status: z.string(),
});

const errorResponseSchema = z.object({
	error: z.string(),
});

// --- Routes ---
const embedRoute = createRoute({
	method: "post",
	path: "/embed",
	summary: "テキスト埋め込み",
	description: "単一テキストを embedding ベクトルに変換する",
	request: {
		body: {
			content: { "application/json": { schema: embedRequestSchema } },
			required: true,
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: embedResponseSchema } },
			description: "埋め込みベクトル",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "リクエスト不正",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "認証エラー",
		},
	},
	security: [{ Bearer: [] }],
});

const embedBatchRoute = createRoute({
	method: "post",
	path: "/embed-batch",
	summary: "バッチテキスト埋め込み",
	description: "複数テキストを embedding ベクトルに一括変換する",
	request: {
		body: {
			content: {
				"application/json": { schema: embedBatchRequestSchema },
			},
			required: true,
		},
	},
	responses: {
		200: {
			content: {
				"application/json": { schema: embedBatchResponseSchema },
			},
			description: "埋め込みベクトル配列",
		},
		400: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "リクエスト不正",
		},
		401: {
			content: { "application/json": { schema: errorResponseSchema } },
			description: "認証エラー",
		},
	},
	security: [{ Bearer: [] }],
});

const healthRoute = createRoute({
	method: "get",
	path: "/health",
	summary: "ヘルスチェック",
	description: "サーバーの稼働状態を確認する",
	responses: {
		200: {
			content: { "application/json": { schema: healthResponseSchema } },
			description: "正常稼働",
		},
		503: {
			content: { "application/json": { schema: healthResponseSchema } },
			description: "モデルロード中",
		},
	},
});

// --- Handlers ---
app.openapi(embedRoute, async (c) => {
	const { text, isQuery } = c.req.valid("json");
	const vector = await embed(text, isQuery);
	return c.json({ vector, dimensions: RAG_CONFIG.qdrant.vectorSize }, 200);
});

app.openapi(embedBatchRoute, async (c) => {
	const { texts, isQuery } = c.req.valid("json");
	const vectors = await embedBatch(texts, isQuery);
	return c.json({ vectors, dimensions: RAG_CONFIG.qdrant.vectorSize }, 200);
});

app.openapi(healthRoute, (c) => {
	if (!isEmbeddingReady()) {
		return c.json({ status: "loading" }, 503);
	}
	return c.json({ status: "ok" }, 200);
});

// --- OpenAPI doc ---
app.doc("/doc", {
	openapi: "3.1.0",
	info: {
		title: "Embedding API",
		version: "1.0.0",
		description: "テキスト埋め込み API（multilingual-e5-small, 384次元）",
	},
	servers: [{ url: "http://localhost:3001", description: "Local" }],
	security: [{ Bearer: [] }],
});

// OpenAPI security scheme 登録
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "API Key",
});

// --- Swagger UI ---
app.get("/ui", swaggerUI({ url: "/doc" }));

// --- Server start ---
const port = Number(process.env.PORT ?? 3001);
console.log(`Embedding API starting on port ${port}...`);

serve({ fetch: app.fetch, port });

// Eager load embedding model (fire-and-forget)
initEmbeddingPipeline().catch((err) => {
	console.error("Failed to load embedding model:", err);
	process.exit(1);
});
