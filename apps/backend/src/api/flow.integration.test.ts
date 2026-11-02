import type { ApiAuth } from "s-private-backend/api/types";
import * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { extendDatabase } from "@s-hirano-ist/s-infrastructure/database";
import { createMobileChunkStore } from "@s-hirano-ist/s-infrastructure/mobile/minio-chunk-store";
import { createBooksStorageService } from "@s-hirano-ist/s-infrastructure/shared/books-storage-service";
import { createImagesStorageService } from "@s-hirano-ist/s-infrastructure/shared/minio-storage-service";
import { tenantContext } from "@s-hirano-ist/s-infrastructure/shared/tenant-context";
import { applyTenantFilter } from "@s-hirano-ist/s-infrastructure/shared/tenant-filter";
import { createMinioClient } from "@s-hirano-ist/s-storage";
import { randomUUID } from "node:crypto";
import { createApiApp } from "s-private-backend/api/app";
import { createApiServices } from "s-private-backend/api/composition";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const enabled = !!url && process.env.TEST_UPLOAD_INTEGRATION === "1";
if (url && !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
	throw new Error("Local database required");
const client = createPrismaClient(
	url ?? "postgresql://root@127.0.0.1:26257/issue2951?sslmode=disable",
);
const owner = `http-flow-${randomUUID()}`;
const bucket = `issue2951-http-${randomUUID()}`;
const png = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR4AQEFAPr/AP8AAP8FAAH/+lyI0QAAAABJRU5ErkJggg==",
	"base64",
);
const minio = enabled
	? createMinioClient({
			endPoint: "127.0.0.1",
			port: 9000,
			useSSL: false,
			accessKey: process.env.MINIO_ROOT_USER ?? "",
			secretKey: process.env.MINIO_ROOT_PASSWORD ?? "",
		})
	: null;
const reporter = { captureException: vi.fn() };
function appFixture() {
	if (!minio) throw new Error("Integration storage is disabled");
	const database = extendDatabase(
		client,
		(model, operation, args) =>
			applyTenantFilter(model, operation, args, tenantContext.getStore()),
		() => {},
	);
	const services = createApiServices({
		database,
		chunks: createMobileChunkStore(minio, bucket),
		storage: {
			images: createImagesStorageService(minio, bucket),
			books: createBooksStorageService(minio, bucket),
		},
		eventDispatcher: {
			async dispatch() {
				throw new Error("Expected notification failure after commit");
			},
		},
		reporter,
		push: {},
		searchVectors: async (query) => ({ query, results: [], totalResults: 0 }),
	});
	const auth: ApiAuth = {
		authenticateBearer: async (incoming) =>
			incoming.headers.get("authorization") === "Bearer foreign"
				? "foreign"
				: owner,
		getWebSession: async () => ({ session: null }),
		isTrustedOrigin: () => false,
		reportError: reporter.captureException,
	};
	return createApiApp(auth, services.reads, services.mutations);
}
function request(
	app: ReturnType<typeof appFixture>,
	path: string,
	method = "GET",
	body?: unknown,
	token = "test-owner",
) {
	return app.request(`/api/v1${path}`, {
		method,
		headers: {
			authorization: `Bearer ${token}`,
			...(body === undefined ? {} : { "content-type": "application/json" }),
		},
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
	});
}
async function createText(
	app: ReturnType<typeof appFixture>,
	domain: "articles" | "notes",
) {
	const operationId = randomUUID();
	const input =
		domain === "articles"
			? {
					operationId,
					title: operationId,
					url: `https://example.com/${operationId}`,
					category: "integration",
					quote: "quote",
				}
			: { operationId, title: operationId, markdown: "# Body" };
	const response = await request(app, `/${domain}`, "POST", input);
	expect(response.status).toBe(201);
	const result = schemas.createResultSchema.parse(await response.json());
	const replay = await request(app, `/${domain}`, "POST", input);
	expect(replay.status).toBe(201);
	expect(await replay.json()).toEqual(result);
	expect(
		(await request(app, `/${domain}`, "POST", { ...input, title: "changed" }))
			.status,
	).toBe(409);
	expect(
		(await request(app, `/${domain}`, "POST", input, "foreign")).status,
	).toBe(404);
	return result;
}
async function createMedia(
	app: ReturnType<typeof appFixture>,
	domain: "images" | "books",
) {
	const operationId = randomUUID();
	const input = {
		operationId,
		domain,
		contentType: "image/png",
		fileSize: png.byteLength,
		metadata:
			domain === "images"
				? { filename: "image.png" }
				: {
						filename: "cover.png",
						isbn: "9784873119038",
						title: "Book",
						rating: 3,
						tags: ["a,b", "c"],
					},
	};
	const start = await request(app, "/uploads", "POST", input);
	expect(start.status).toBe(200);
	const session = schemas.uploadSessionSchema.parse(await start.json());
	expect(
		(await request(app, `/uploads/${session.uploadId}/complete`, "POST"))
			.status,
	).toBe(409);
	const chunk = await app.request(
		`/api/v1/uploads/${session.uploadId}/chunks/0`,
		{
			method: "PUT",
			headers: {
				authorization: "Bearer test-owner",
				"content-type": "application/octet-stream",
			},
			body: png,
		},
	);
	expect(chunk.status).toBe(200);
	const completion = await request(
		app,
		`/uploads/${session.uploadId}/complete`,
		"POST",
	);
	expect(completion.status).toBe(201);
	const result = schemas.createResultSchema.parse(await completion.json());
	const replay = await request(
		app,
		`/uploads/${session.uploadId}/complete`,
		"POST",
	);
	expect(replay.status).toBe(201);
	expect(await replay.json()).toEqual(result);
	expect(
		(await request(app, `/uploads/${session.uploadId}`, "DELETE")).status,
	).toBe(409);
	expect(
		(
			await request(
				app,
				`/uploads/${session.uploadId}`,
				"GET",
				undefined,
				"foreign",
			)
		).status,
	).toBe(404);
	const original = await request(
		app,
		`/media/${domain}/${result.resource.id}/original`,
	);
	expect(original.status).toBe(200);
	expect(Buffer.from(await original.arrayBuffer())).toEqual(png);
	const thumbnail = await request(
		app,
		`/media/${domain}/${result.resource.id}/thumbnail`,
	);
	expect(thumbnail.status).toBe(200);
	expect(thumbnail.headers.get("content-type")).toBe("image/webp");
	return result;
}
function create(
	app: ReturnType<typeof appFixture>,
	domain: "articles" | "notes" | "images" | "books",
) {
	if (domain === "articles" || domain === "notes")
		return createText(app, domain);
	return createMedia(app, domain);
}

beforeAll(async () => {
	if (minio) await minio.makeBucket(bucket);
});
afterAll(async () => {
	if (enabled && minio) {
		const objects: string[] = [];
		for await (const object of minio.listObjectsV2(bucket, "", true))
			if (object.name) objects.push(object.name);
		if (objects.length > 0) await minio.removeObjects(bucket, objects);
		await minio.removeBucket(bucket);
		await client.article.deleteMany({ where: { userId: owner } });
		await client.note.deleteMany({ where: { userId: owner } });
		await client.image.deleteMany({ where: { userId: owner } });
		await client.book.deleteMany({ where: { userId: owner } });
		await client.category.deleteMany({ where: { userId: owner } });
		await client.mobileUpload.deleteMany({ where: { userId: owner } });
		await client.mobileOperation.deleteMany({ where: { userId: owner } });
		await client.mobileSyncChange.deleteMany({ where: { userId: owner } });
		await client.mobileSyncVersion.deleteMany({ where: { userId: owner } });
	}
	await client.$disconnect();
});
describe.skipIf(!enabled)(
	"real HTTP → Application → CockroachDB/MinIO → HTTP flow",
	() => {
		test.each(["articles", "notes", "images", "books"] as const)(
			"%s commits, replays, reads, syncs and deletes even when notification delivery fails",
			async (domain) => {
				const app = appFixture();
				const head = schemas.syncHeadSchema.parse(
					await (await request(app, "/sync/head")).json(),
				);
				const result = await create(app, domain);
				expect(
					(
						await client.mobileOperation.findUniqueOrThrow({
							where: { id: result.operationId },
						})
					).status,
				).toBe("SUCCEEDED");
				expect(
					(await request(app, `/${domain}/${result.resource.id}`)).status,
				).toBe(200);
				expect(
					(
						await request(
							app,
							`/${domain}/${result.resource.id}`,
							"GET",
							undefined,
							"foreign",
						)
					).status,
				).toBe(404);
				expect(
					(await request(app, `/${domain}?status=UNEXPORTED`)).status,
				).toBe(200);
				const changes = schemas.changesPageSchema.parse(
					await (
						await request(
							app,
							`/sync/changes?cursor=${encodeURIComponent(head.cursor)}`,
						)
					).json(),
				);
				expect(changes.data.map((change) => change.action)).toContain("upsert");
				expect(
					(await request(app, `/${domain}/${result.resource.id}`, "DELETE"))
						.status,
				).toBe(204);
				expect(
					(await request(app, `/${domain}/${result.resource.id}`)).status,
				).toBe(404);
				expect(reporter.captureException).toHaveBeenCalled();
			},
		);
		test("expired uploads return 410 through the HTTP boundary", async () => {
			const app = appFixture();
			const response = await request(app, "/uploads", "POST", {
				operationId: randomUUID(),
				domain: "images",
				contentType: "image/png",
				fileSize: png.byteLength,
				metadata: { filename: "image.png" },
			});
			const session = schemas.uploadSessionSchema.parse(await response.json());
			await client.mobileUpload.update({
				where: { id: session.uploadId },
				data: { expiresAt: new Date(0) },
			});
			expect((await request(app, `/uploads/${session.uploadId}`)).status).toBe(
				410,
			);
		});
	},
);
