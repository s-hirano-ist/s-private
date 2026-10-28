import { createApiDocument } from "@s-hirano-ist/s-api-contracts/document";
import {
	listQuerySchema,
	snapshotRecordSchema,
	syncChangeSchema,
	uploadStartSchema,
} from "@s-hirano-ist/s-api-contracts/schemas";
import { describe, expect, test } from "vitest";
import { z } from "zod";

describe("Shared API contract", () => {
	test("emits required path parameters and non-null numeric queries", () => {
		const document = createApiDocument();
		const serialized = JSON.parse(JSON.stringify(document)) as {
			paths: Record<
				string,
				{
					get?: { parameters: { name: string; schema: { type: string } }[] };
					put?: {
						parameters: {
							name: string;
							required: boolean;
							schema: { type: string };
						}[];
					};
				}
			>;
		};
		expect(
			serialized.paths["/uploads/{id}/chunks/{part}"].put?.parameters.find(
				(parameter) => parameter.name === "part",
			)?.required,
		).toBe(true);
		expect(
			serialized.paths["/uploads/{id}/chunks/{part}"].put?.parameters.find(
				(parameter) => parameter.name === "part",
			)?.schema.type,
		).toBe("integer");
		expect(
			serialized.paths["/articles"].get?.parameters.find(
				(parameter) => parameter.name === "offset",
			)?.schema.type,
		).toBe("integer");
	});
	test("requires the record corresponding to the snapshot domain", () => {
		expect(
			snapshotRecordSchema.safeParse({
				domain: "categories",
				record: { id: "c1", name: "Category" },
			}).success,
		).toBe(true);
		expect(
			snapshotRecordSchema.safeParse({
				domain: "articles",
				record: { id: "c1", name: "Category" },
			}).success,
		).toBe(false);
	});
	test("separates deletion from upsert payloads", () => {
		expect(
			syncChangeSchema.safeParse({
				id: "c1",
				version: "9007199254740993",
				action: "delete",
				domain: "categories",
			}).success,
		).toBe(true);
		expect(
			syncChangeSchema.safeParse({ id: "c1", version: "1", action: "upsert" })
				.success,
		).toBe(false);
	});
	test("validates upload metadata by domain", () => {
		const base = {
			operationId: "6ab4a998-177a-4a34-ae38-9f5e75a05b2c",
			contentType: "image/jpeg",
			fileSize: 100,
			domain: "images",
		};
		expect(
			uploadStartSchema.safeParse({
				...base,
				metadata: { filename: "test.jpg" },
			}).success,
		).toBe(true);
		expect(
			uploadStartSchema.safeParse({ ...base, metadata: { isbn: "123" } })
				.success,
		).toBe(false);
		expect(
			uploadStartSchema.safeParse({
				...base,
				fileSize: 10 * 1024 * 1024 + 1,
				metadata: { filename: "test.jpg" },
			}).success,
		).toBe(false);
	});
});

test("media contract declares the image MIME types served by the backend", () => {
	const content = z
		.object({ content: z.record(z.string(), z.unknown()) })
		.parse(
			createApiDocument().paths?.["/media/{domain}/{id}/{variant}"]?.get
				?.responses["200"],
		).content;
	expect(Object.keys(content).toSorted()).toEqual([
		"application/octet-stream",
		"image/jpeg",
		"image/png",
		"image/webp",
	]);
});

test("chunk size keeps its integer type and fixed value in OpenAPI", () => {
	const schema = z
		.object({ properties: z.record(z.string(), z.unknown()) })
		.parse(createApiDocument().components?.schemas?.UploadSession);
	expect(schema.properties.chunkSize).toEqual({
		type: "integer",
		enum: [1048576],
	});
});

test("numeric query bounds and defaults survive OpenAPI generation", () => {
	const paths = createApiDocument().paths;
	const numeric = (path: string, name: string) =>
		z
			.array(
				z.object({
					name: z.string(),
					schema: z.record(z.string(), z.unknown()),
				}),
			)
			.parse(paths?.[path]?.get?.parameters)
			.find((parameter) => parameter.name === name)?.schema;
	for (const domain of ["articles", "notes", "images", "books"]) {
		expect(numeric("/" + domain, "offset")).toEqual({
			type: "integer",
			minimum: 0,
			maximum: 10000,
			default: 0,
		});
		expect(numeric("/" + domain, "limit")).toEqual({
			type: "integer",
			minimum: 1,
			maximum: 100,
			default: 30,
		});
	}
	for (const path of ["/sync/snapshot", "/sync/changes"])
		expect(numeric(path, "limit")).toEqual({
			type: "integer",
			minimum: 1,
			maximum: 100,
			default: 100,
		});
	expect(numeric("/search", "limit")).toEqual({
		type: "integer",
		minimum: 1,
		maximum: 50,
		default: 20,
	});
	expect(listQuerySchema.parse({})).toEqual({ offset: 0, limit: 30 });
	for (const offset of [-1, 10001, 1.5])
		expect(listQuerySchema.safeParse({ offset }).success).toBe(false);
});

test("creation inputs enforce domain bounds without changing hash input", async () => {
	const { articleCreateSchema, noteCreateSchema, snapshotQuerySchema } =
		await import("@s-hirano-ist/s-api-contracts/schemas");
	const operationId = "6ab4a998-177a-4a34-ae38-9f5e75a05b2c";
	const article = {
		operationId,
		title: "a".repeat(128),
		url: "https://example.com",
		category: "  Technology  ",
		quote: "q".repeat(512),
	};
	expect(articleCreateSchema.parse(article)).toEqual(article);
	for (const extra of [
		{ title: "a".repeat(129) },
		{ category: " " },
		{ category: "a".repeat(17) },
		{ quote: "a".repeat(513) },
		{ url: "ftp://example.com" },
	])
		expect(
			articleCreateSchema.safeParse({ ...article, ...extra }).success,
		).toBe(false);
	const note = { operationId, title: "n".repeat(64), markdown: "Body" };
	expect(noteCreateSchema.safeParse(note).success).toBe(true);
	for (const extra of [{ title: "n".repeat(65) }, { markdown: "" }])
		expect(noteCreateSchema.safeParse({ ...note, ...extra }).success).toBe(
			false,
		);
	const book = {
		operationId,
		domain: "books",
		contentType: "image/jpeg",
		fileSize: 100,
		metadata: {
			isbn: "978-4-06-521234-5",
			title: "b".repeat(512),
			rating: 5,
			tags: ["  tag  ", " "],
		},
	};
	expect(uploadStartSchema.parse(book)).toEqual(book);
	for (const extra of [
		{ isbn: "1234567890" },
		{ title: "b".repeat(513) },
		{ rating: 0 },
		{ rating: 6 },
		{ tags: ["a".repeat(65)] },
	])
		expect(
			uploadStartSchema.safeParse({
				...book,
				metadata: { ...book.metadata, ...extra },
			}).success,
		).toBe(false);
	expect(
		snapshotQuerySchema.parse({ domain: "notes", after: "a".repeat(512) })
			.after,
	).toHaveLength(512);
	expect(
		snapshotQuerySchema.safeParse({ domain: "notes", after: "a".repeat(513) })
			.success,
	).toBe(false);
});

test("OpenAPI patterns are portable regular expressions without literal delimiters or flags", () => {
	const document = createApiDocument();
	const article = z
		.object({
			properties: z.object({
				url: z.object({ pattern: z.string() }),
				category: z.object({ pattern: z.string() }),
			}),
		})
		.parse(document.components?.schemas?.ArticleCreate);
	expect(
		new RegExp(article.properties.url.pattern, "u").test("https://example.com"),
	).toBe(true);
	expect(
		new RegExp(article.properties.category.pattern, "u").test("  Technology  "),
	).toBe(true);
	expect(
		new RegExp(article.properties.category.pattern, "u").test("a".repeat(17)),
	).toBe(false);
	const upload = z
		.object({
			properties: z.object({
				metadata: z.object({
					properties: z.object({ isbn: z.object({ pattern: z.string() }) }),
				}),
			}),
		})
		.parse(document.components?.schemas?.BookUploadStart);
	expect(
		new RegExp(upload.properties.metadata.properties.isbn.pattern, "u").test(
			"978-4-06-521234-5",
		),
	).toBe(true);
	const change = z
		.object({
			properties: z.object({ version: z.object({ pattern: z.string() }) }),
		})
		.parse(document.components?.schemas?.SyncDelete);
	expect(
		new RegExp(change.properties.version.pattern, "u").test("9007199254740993"),
	).toBe(true);
});
