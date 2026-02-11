import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { ensureCollection } from "@s-hirano-ist/s-search/qdrant-client";
import { searchContent } from "@s-hirano-ist/s-search/search";
import { z } from "zod";

const app = new OpenAPIHono();

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
const searchRequestSchema = z.object({
	query: z.string().min(1),
	topK: z.number().int().min(1).max(50).optional().default(5),
	type: z.enum(["markdown_note", "bookmark_json"]).optional(),
	heading: z.string().optional(),
});

const searchResultSchema = z.object({
	score: z.number(),
	text: z.string(),
	title: z.string(),
	url: z.string().optional(),
	heading_path: z.array(z.string()),
	type: z.enum(["markdown_note", "bookmark_json"]),
	doc_id: z.string(),
});

const searchResponseSchema = z.object({
	results: z.array(searchResultSchema),
	query: z.string(),
	totalResults: z.number(),
});

const healthResponseSchema = z.object({
	status: z.string(),
});

const errorResponseSchema = z.object({
	error: z.string(),
});

// --- Routes ---
const searchRoute = createRoute({
	method: "post",
	path: "/search",
	summary: "RAG ベクトル検索",
	description:
		"クエリテキストを embedding に変換し、Qdrant でベクトル類似度検索を実行する",
	request: {
		body: {
			content: { "application/json": { schema: searchRequestSchema } },
			required: true,
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: searchResponseSchema } },
			description: "検索結果",
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
	},
});

// --- Handlers ---
app.openapi(searchRoute, async (c) => {
	const { query, topK, type, heading } = c.req.valid("json");
	const response = await searchContent(query, { topK, type, heading });
	return c.json(response, 200);
});

app.openapi(healthRoute, (c) => {
	return c.json({ status: "ok" }, 200);
});

// --- OpenAPI doc ---
app.doc("/doc", {
	openapi: "3.1.0",
	info: {
		title: "Search API",
		version: "1.0.0",
		description: "RAG ベクトル検索 API（Qdrant + multilingual-e5-small）",
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
console.log(`Search API starting on port ${port}...`);

// Ensure collection and payload indexes exist before serving requests
ensureCollection()
	.then(() => {
		serve({ fetch: app.fetch, port });
	})
	.catch((err) => {
		console.error("Failed to ensure collection:", err);
		process.exit(1);
	});
