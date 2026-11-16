import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { extendDatabase } from "@s-hirano-ist/s-infrastructure/database";
import { createMobileChunkStore } from "@s-hirano-ist/s-infrastructure/mobile/s3-chunk-store";
import { createBooksStorageService } from "@s-hirano-ist/s-infrastructure/shared/books-storage-service";
import { createImagesStorageService } from "@s-hirano-ist/s-infrastructure/shared/images-storage-service";
import { tenantContext } from "@s-hirano-ist/s-infrastructure/shared/tenant-context";
import { applyTenantFilter } from "@s-hirano-ist/s-infrastructure/shared/tenant-filter";
import { createObjectStorageClient } from "@s-hirano-ist/s-storage";
import { randomUUID } from "node:crypto";
import { createApiServices } from "s-private-backend/api/composition";
import { createContentMcpServer } from "s-private-backend/mcp/tools";
import {
	afterAll,
	beforeAll,
	describe,
	expect,
	test,
	vi,
} from "vite-plus/test";

const url = process.env.MCP_TEST_DATABASE_URL;
if (url) {
	const parsed = new URL(url);
	if (
		!["localhost", "127.0.0.1"].includes(parsed.hostname) ||
		!parsed.pathname.startsWith("/rss_worktree_")
	)
		throw new Error("Use a dedicated local worktree database");
}
const enabled = !!url && process.env.TEST_UPLOAD_INTEGRATION === "1";
const db = createPrismaClient(
	url ??
		"postgresql://root@127.0.0.1:26257/rss_worktree_mcp_disabled?sslmode=disable",
);
const owner = `mcp-${randomUUID()}`;
const foreignOwner = `mcp-foreign-${randomUUID()}`;
const bucket = `mcp-${randomUUID()}`;
const minio = enabled
	? createObjectStorageClient({
			endpoint: "http://127.0.0.1:9000",
			region: "us-east-1",
			forcePathStyle: true,
			accessKeyId: process.env.MINIO_ROOT_USER ?? "",
			secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? "",
		})
	: null;
const connections: Client[] = [];
let services: ReturnType<typeof createApiServices>;
let alice: Client;
let bob: Client;
async function connect(userId: string) {
	const server = createContentMcpServer(
		{
			token: "test",
			clientId: "integration",
			scopes: ["content:read", "content:create"],
			extra: { owner: userId },
		},
		{
			reads: services.reads,
			writes: services.mutations.writes,
			uploads: services.mutations.uploads,
			rss: services.mutations.rss,
			reportError: vi.fn(),
			telemetry: { log: vi.fn(), count: vi.fn(), duration: vi.fn() },
		},
	);
	const [clientTransport, serverTransport] =
		InMemoryTransport.createLinkedPair();
	await server.connect(serverTransport);
	const client = new Client({ name: "integration", version: "1.0.0" });
	await client.connect(clientTransport);
	connections.push(client);
	return client;
}
async function call(
	client: Client,
	name: string,
	args: Record<string, unknown>,
) {
	const result = await client.callTool({ name, arguments: args });
	expect(result.isError).not.toBe(true);
	return result.structuredContent;
}
async function failure(
	client: Client,
	name: string,
	args: Record<string, unknown>,
	code: string,
) {
	expect(await client.callTool({ name, arguments: args })).toMatchObject({
		isError: true,
		content: [{ type: "text", text: code }],
	});
}
beforeAll(async () => {
	if (!minio) return;
	await minio.createBucket(bucket);
	services = createApiServices({
		database: extendDatabase(
			db,
			(model, operation, args) =>
				applyTenantFilter(model, operation, args, tenantContext.getStore()),
			() => {},
		),
		chunks: createMobileChunkStore(minio, bucket),
		storage: {
			images: createImagesStorageService(minio, bucket),
			books: createBooksStorageService(minio, bucket),
		},
		eventDispatcher: { dispatch: async () => {} },
		reporter: { captureException: vi.fn() },
		flushReports: async () => true,
		push: {},
		searchVectors: async (query) => ({ query, results: [], totalResults: 0 }),
	});
	[alice, bob] = await Promise.all([connect(owner), connect(foreignOwner)]);
});
afterAll(async () => {
	await Promise.all(connections.map((client) => client.close()));
	if (enabled && minio) {
		const objects = await minio.listObjects(bucket, "");
		await Promise.all(objects.map((key) => minio.removeObject(bucket, key)));
		await minio.deleteBucket(bucket);
		const where = { userId: { in: [owner, foreignOwner] } };
		await db.article.deleteMany({ where });
		await db.note.deleteMany({ where });
		await db.image.deleteMany({ where });
		await db.book.deleteMany({ where });
		await db.category.deleteMany({ where });
		await db.rssFeed.deleteMany({ where });
		await db.rssSaved.deleteMany({ where });
		await db.mediaDeletion.deleteMany({ where });
		await db.mobileUpload.deleteMany({ where });
		await db.mobileOperation.deleteMany({ where });
		await db.mobileSyncChange.deleteMany({ where });
		await db.mobileSyncVersion.deleteMany({ where });
	}
	await db.$disconnect();
});

function textInput(domain: "articles" | "notes") {
	const operationId = randomUUID();
	const input =
		domain === "articles"
			? {
					operationId,
					title: operationId,
					url: `https://example.com/${operationId}`,
					category: "MCP",
				}
			: { operationId, title: operationId, markdown: "# Body" };
	return {
		input,
		tool: domain === "articles" ? "create_article" : "create_note",
		operationId,
	};
}

function mediaInput(
	domain: "images" | "books",
	operationId: string,
	fileSize: number,
) {
	return {
		operationId,
		domain,
		contentType: "image/png",
		fileSize,
		metadata:
			domain === "images"
				? { filename: "image.png" }
				: {
						isbn: "9784873119038",
						title: "Book",
						rating: 3,
						tags: ["MCP"],
					},
	};
}

describe.skipIf(!enabled)("MCP → Application → local CockroachDB/MinIO", () => {
	test.each(["articles", "notes"] as const)(
		"%s adds, replays and reads without overwriting",
		async (domain) => {
			const { operationId, input, tool } = textInput(domain);
			const result = schemas.createResultSchema.parse(
				await call(alice, tool, input),
			);
			expect(await call(alice, tool, input)).toEqual(result);
			await failure(
				alice,
				tool,
				{ ...input, title: "changed" },
				"OPERATION_CONFLICT",
			);
			await failure(bob, tool, input, "NOT_FOUND");
			await failure(
				alice,
				tool,
				{ ...input, operationId: randomUUID() },
				"DUPLICATE",
			);
			expect(
				await call(alice, "get_content", { domain, id: result.resource.id }),
			).toMatchObject({ data: { title: operationId } });
			await failure(
				bob,
				"get_content",
				{ domain, id: result.resource.id },
				"NOT_FOUND",
			);
		},
	);

	// A valid PNG with trailing bytes exercises >1 MiB uploads without storing a fixture asset.
	const png = Buffer.from(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR4AQEFAPr/AP8AAP8FAAH/+lyI0QAAAABJRU5ErkJggg==",
		"base64",
	);
	test.each(["images", "books"] as const)(
		"%s supports multi-part addition, retry and binary read",
		async (domain) => {
			const bytes = Buffer.concat([png, Buffer.alloc(schemas.uploadChunkSize)]);
			const operationId = randomUUID();
			const upload = mediaInput(domain, operationId, bytes.length);
			const session = schemas.uploadSessionSchema.parse(
				await call(alice, "start_upload", { upload }),
			);
			expect(await call(alice, "start_upload", { upload })).toEqual(session);
			const id = session.uploadId;
			await failure(alice, "complete_upload", { id }, "UPLOAD_INCOMPLETE");
			await failure(bob, "get_upload", { id }, "NOT_FOUND");
			await failure(
				bob,
				"put_upload_chunk",
				{
					id,
					part: 0,
					data: bytes.subarray(0, session.chunkSize).toString("base64"),
				},
				"NOT_FOUND",
			);
			await failure(bob, "complete_upload", { id }, "NOT_FOUND");
			await failure(
				alice,
				"put_upload_chunk",
				{ id, part: 0, data: png.toString("base64") },
				"INVALID_CHUNK_SIZE",
			);
			for (let part = 0; part < 2; part++) {
				const data = bytes
					.subarray(part * session.chunkSize, (part + 1) * session.chunkSize)
					.toString("base64");
				await call(alice, "put_upload_chunk", { id, part, data });
				await call(alice, "put_upload_chunk", { id, part, data });
			}
			await failure(
				alice,
				"put_upload_chunk",
				{
					id,
					part: 0,
					data: Buffer.alloc(session.chunkSize, 1).toString("base64"),
				},
				"OPERATION_CONFLICT",
			);
			expect(await call(alice, "get_upload", { id })).toMatchObject({
				receivedParts: [0, 1],
			});
			const result = schemas.createResultSchema.parse(
				await call(alice, "complete_upload", { id }),
			);
			expect(await call(alice, "complete_upload", { id })).toEqual(result);
			const args = {
				domain,
				id: result.resource.id,
				variant: "original",
				length: 700000,
			};
			const received: Buffer[] = [];
			let offset: number | null = 0;
			do {
				const page = (await call(alice, "get_media", { ...args, offset })) as {
					data: string;
					nextOffset: number | null;
				};
				received.push(Buffer.from(page.data, "base64"));
				offset = page.nextOffset;
			} while (offset !== null);
			expect(Buffer.concat(received)).toEqual(bytes);
			expect(
				await call(alice, "get_media", { ...args, variant: "thumbnail" }),
			).toMatchObject({ mimeType: "image/webp", nextOffset: null });
			await failure(bob, "get_media", args, "NOT_FOUND");
			const content = await call(alice, "get_content", {
				domain,
				id: result.resource.id,
			});
			expect(JSON.stringify(content)).not.toMatch(/imagePath|"path"/u);
		},
		30000,
	);

	test("expired uploads cannot be read, appended or completed", async () => {
		const session = schemas.uploadSessionSchema.parse(
			await call(alice, "start_upload", {
				upload: {
					operationId: randomUUID(),
					domain: "images",
					contentType: "image/png",
					fileSize: png.length,
					metadata: { filename: "expire.png" },
				},
			}),
		);
		await db.mobileUpload.update({
			where: { id: session.uploadId },
			data: { expiresAt: new Date(0) },
		});
		await failure(
			alice,
			"get_upload",
			{ id: session.uploadId },
			"UPLOAD_EXPIRED",
		);
		await failure(
			alice,
			"put_upload_chunk",
			{ id: session.uploadId, part: 0, data: png.toString("base64") },
			"UPLOAD_EXPIRED",
		);
		await failure(
			alice,
			"complete_upload",
			{ id: session.uploadId },
			"UPLOAD_EXPIRED",
		);
	});

	test("RSS additions and both imports preserve existing metadata, unread and foreign state", async () => {
		const feed = {
			title: "Existing",
			url: "https://example.com/existing-feed",
			folder: "Tech",
		};
		const entry = {
			title: "Saved",
			url: "https://example.com/existing-saved",
			publishedAt: null,
		};
		for (const client of [alice, bob]) {
			expect(await call(client, "subscribe_rss", feed)).toEqual({
				added: true,
			});
			expect(await call(client, "save_rss", entry)).toEqual({ added: true });
		}
		const existingFeed = await db.rssFeed.findFirstOrThrow({
			where: { userId: owner },
		});
		await db.rssUnread.create({
			data: {
				id: randomUUID(),
				userId: owner,
				feedId: existingFeed.id,
				title: "Unread",
				url: "https://example.com/unread",
				receivedAt: new Date(),
			},
		});
		await db.rssSeen.create({
			data: { feedId: existingFeed.id, hash: new Uint8Array(32).fill(1) },
		});
		const snapshot = async () => ({
			feeds: await db.rssFeed.findMany({
				where: { OR: [{ userId: foreignOwner }, { id: existingFeed.id }] },
				orderBy: { id: "asc" },
			}),
			saved: await db.rssSaved.findMany({
				where: {
					OR: [{ userId: foreignOwner }, { userId: owner, url: entry.url }],
				},
				orderBy: { id: "asc" },
			}),
			unread: await db.rssUnread.findMany({
				where: { userId: { in: [owner, foreignOwner] } },
				orderBy: { id: "asc" },
			}),
			seen: await db.rssSeen.findMany({
				where: { feed: { userId: { in: [owner, foreignOwner] } } },
				orderBy: { feedId: "asc" },
			}),
		});
		const before = await snapshot();
		expect(
			await call(alice, "subscribe_rss", { ...feed, title: "Changed" }),
		).toEqual({ added: false });
		expect(
			await call(alice, "save_rss", { ...entry, title: "Changed" }),
		).toEqual({ added: false });
		const opml = {
			kind: "opml",
			content:
				'<opml><body><outline title="Changed" xmlUrl="https://example.com/existing-feed"/><outline title="New" xmlUrl="https://example.com/new-feed"/></body></opml>',
		};
		const starred = {
			kind: "starred",
			content: JSON.stringify({
				items: [
					{ title: "Changed", url: entry.url },
					{ title: "New", url: "https://example.com/new-saved" },
					{ url: "file:///invalid" },
				],
			}),
		};
		expect(await call(alice, "import_rss", opml)).toEqual({
			added: 1,
			duplicates: 1,
			invalid: 0,
		});
		expect(await call(alice, "import_rss", opml)).toEqual({
			added: 0,
			duplicates: 2,
			invalid: 0,
		});
		expect(await call(alice, "import_rss", starred)).toEqual({
			added: 1,
			duplicates: 1,
			invalid: 1,
		});
		expect(await call(alice, "import_rss", starred)).toEqual({
			added: 0,
			duplicates: 2,
			invalid: 1,
		});
		expect(await snapshot()).toEqual(before);
		expect(await call(alice, "list_rss", {})).toMatchObject({
			unreadCount: 1,
			savedCount: 2,
		});
		expect(await call(bob, "list_rss", {})).toMatchObject({
			unreadCount: 0,
			savedCount: 1,
		});
	});

	test("concurrent additions use the authenticated tenant", async () => {
		await Promise.all(
			(
				[
					[alice, owner],
					[bob, foreignOwner],
				] as const
			).map(async ([client, userId]) => {
				const result = schemas.createResultSchema.parse(
					await call(client, "create_note", {
						operationId: randomUUID(),
						title: "Concurrent",
						markdown: userId,
					}),
				);
				expect(
					await db.note.findUniqueOrThrow({
						where: { id: result.resource.id },
					}),
				).toMatchObject({ userId, markdown: userId });
			}),
		);
		expect(tenantContext.getStore()).toBeUndefined();
	});
});
