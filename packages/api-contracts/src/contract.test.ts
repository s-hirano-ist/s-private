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
