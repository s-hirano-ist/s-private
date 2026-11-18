import type { RssService } from "@s-hirano-ist/s-application/rss/service";
import type { JWTPayload, JSONWebKeySet } from "jose";
import type { ReadService } from "s-private-backend/api/read-service";
import {
	Client,
	StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { tenantContext } from "@s-hirano-ist/s-infrastructure/shared/tenant-context";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import { createBackendHttpApp } from "s-private-backend/api/http-app";
import { verifyMobileToken } from "s-private-backend/auth/mobile-auth";
import { createMcpApp } from "s-private-backend/mcp/app";
import { beforeAll, beforeEach, expect, test, vi } from "vite-plus/test";

const jwks = vi.hoisted(() => ({
	value: { keys: [] } as JSONWebKeySet,
	failed: false,
}));
vi.mock("jose", async (importOriginal) => {
	const actual = await importOriginal<typeof import("jose")>();
	return {
		...actual,
		createRemoteJWKSet: vi.fn(
			() =>
				async (
					...args: Parameters<ReturnType<typeof actual.createLocalJWKSet>>
				) => {
					if (jwks.failed) throw new Error("sensitive infrastructure failure");
					return actual.createLocalJWKSet(jwks.value)(...args);
				},
		),
	};
});
const config = {
	resource: new URL("https://api.example.test/mcp"),
	issuer: "https://auth.example.test/",
	clientIds: ["test-client"],
	origins: ["https://api.example.test", "https://inspector.example.test"],
};
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
let secondKeys: Awaited<ReturnType<typeof generateKeyPair>>;
beforeAll(async () => {
	keys = await generateKeyPair("RS256");
	secondKeys = await generateKeyPair("RS256");
	jwks.value = {
		keys: [
			{ ...(await exportJWK(keys.publicKey)), kid: "test-key", alg: "RS256" },
		],
	};
});
beforeEach(() => {
	jwks.failed = false;
});
async function token(claims: JWTPayload = {}, privateKey = keys.privateKey) {
	return new SignJWT({ scope: "content:read", azp: "test-client", ...claims })
		.setProtectedHeader({ alg: "RS256", kid: "test-key" })
		.setIssuer(typeof claims.iss === "string" ? claims.iss : config.issuer)
		.setAudience(claims.aud ?? config.resource.href)
		.setSubject(claims.sub ?? "auth0|alice")
		.setExpirationTime(claims.exp ?? Math.floor(Date.now() / 1000) + 3600)
		.sign(privateKey);
}
const base = {
	status: "UNEXPORTED",
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
	exportedAt: null,
};
const note = (owner: string) => ({
	...base,
	id: `${owner}-note`,
	title: `${owner} title`,
	markdown: `${owner} private body`,
});
const feedId = "11111111-1111-4111-8111-111111111111";
const entryId = "22222222-2222-4222-8222-222222222222";
function rssPage(owner: string) {
	const entry = {
		id: entryId,
		title: `${owner} RSS title`,
		url: `https://example.test/${owner}/article`,
		publishedAt: null,
	};
	return {
		snapshotRevision: 0,
		newerCount: 0,
		offset: 0,
		feeds: [
			{
				id: feedId,
				title: `${owner} feed`,
				url: `https://example.test/${owner}/feed`,
				folder: "Tech",
				lastFetchedAt: null,
				error: null,
			},
		],
		unread: [{ ...entry, feedId, receivedAt: base.createdAt }],
		saved: [{ ...entry, savedAt: base.createdAt }],
		unreadCount: 1,
		savedCount: 1,
	};
}
function setup(page?: RssService["page"]) {
	const assertOwner = async (owner: string) => {
		await new Promise<void>((resolve) => {
			setImmediate(resolve);
		});
		expect(tenantContext.getStore()?.userId).toBe(owner);
	};
	const created = async (
		owner: string,
		input: { operationId: string },
		type: "articles" | "notes",
	) => {
		await assertOwner(owner);
		return {
			accepted: true as const,
			operationId: input.operationId,
			resource: { id: `${owner}-created`, type },
		};
	};
	const writes = {
		article: vi.fn((owner, input) => created(owner, input, "articles")),
		note: vi.fn((owner, input) => created(owner, input, "notes")),
	};
	const uploadSession = {
		uploadId: "alice-upload",
		operationId: feedId,
		chunkSize: 1048576 as const,
		receivedParts: [],
		expiresAt: "2099-01-01T00:00:00.000Z",
	};
	const uploads = {
		start: vi.fn(async (owner, input) => {
			await assertOwner(owner);
			return {
				...uploadSession,
				uploadId: `${owner}-upload`,
				operationId: input.operationId,
			};
		}),
		get: vi.fn(async (owner, id) => {
			await assertOwner(owner);
			if (id !== `${owner}-upload`) throw new ApplicationError("NOT_FOUND");
			return uploadSession;
		}),
		put: vi.fn(async (owner, id, part, _bytes) => {
			await assertOwner(owner);
			if (id !== `${owner}-upload`) throw new ApplicationError("NOT_FOUND");
			return { accepted: true as const, part };
		}),
		complete: vi.fn(async (owner, id) => {
			await assertOwner(owner);
			if (id !== `${owner}-upload`) throw new ApplicationError("NOT_FOUND");
			return {
				accepted: true as const,
				operationId: feedId,
				resource: { id: `${owner}-created`, type: "images" as const },
			};
		}),
	};
	const reads = {
		media: vi.fn(async (owner, _domain, id, _variant) => {
			await assertOwner(owner);
			if (id !== `${owner}-image`) throw new ApplicationError("NOT_FOUND");
			return new Response(Buffer.from("abcdef"), {
				headers: { "content-type": "image/png" },
			});
		}),
		page: vi.fn(async (_domain, owner, query) => {
			await assertOwner(owner);
			return { data: [note(owner)], totalCount: 1, ...query };
		}),
		detail: vi.fn(async (domain, owner, id) => {
			await assertOwner(owner);
			if (id !== `${owner}-note`) throw new ApplicationError("NOT_FOUND");
			if (domain === "images")
				return {
					...base,
					id,
					path: "internal/secret.webp",
					contentType: "image/webp",
					fileSize: 100,
					width: 10,
					height: 10,
				};
			return note(owner);
		}),
		count: vi.fn(async (_domain, owner) => {
			await assertOwner(owner);
			return { count: 1 };
		}),
		search: vi.fn(async (owner, query) => {
			await assertOwner(owner);
			return {
				query: query.query,
				data: [
					{
						id: `${owner}-note`,
						title: `${owner} title`,
						snippet: `${owner} snippet`,
						type: "notes",
					},
				],
			};
		}),
		categories: vi.fn(async (owner) => [
			{ id: `${owner}-category`, name: "category" },
		]),
		lookup: vi.fn(async (domain, owner) =>
			domain === "notes"
				? note(owner)
				: {
						...base,
						id: `${owner}-book`,
						isbn: "9784065212345",
						title: "book",
						markdown: "private text",
						imagePath: "internal/book.webp",
						rating: 3,
						tags: ["tag"],
					},
		),
	};
	const rss = {
		subscribe: vi.fn(async (owner, _input) => {
			await assertOwner(owner);
			return true;
		}),
		save: vi.fn(async (owner, _input) => {
			await assertOwner(owner);
			return {
				added: true,
				saved: {
					..._input,
					id: "00000000-0000-4000-8000-000000000001",
					savedAt: "2026-11-18T00:00:00Z",
				},
			};
		}),
		import: vi.fn(
			async (owner: string, input: Parameters<RssService["import"]>[1]) => {
				await assertOwner(owner);
				return {
					added: input.feeds.length + input.saved.length,
					duplicates: 0,
					invalid: input.invalid,
				};
			},
		),
		page: vi.fn(
			page ??
				(async (owner: string, _offset: number, _feedId?: string) => {
					await assertOwner(owner);
					return rssPage(owner);
				}),
		),
	};
	const deps = {
		rss,
		writes,
		uploads,
		reads: reads as unknown as ReadService,
		accounts: {
			findLinkedUser: vi.fn(
				async (subject: string) =>
					({ "auth0|alice": "alice", "auth0|bob": "bob" })[subject] ?? null,
			),
		},
		reportError: vi.fn(),
		telemetry: { log: vi.fn(), count: vi.fn(), duration: vi.fn() },
	};
	const app = createMcpApp(config, deps);
	async function request(
		path: string,
		accessToken?: string,
		init: RequestInit = {},
	) {
		const headers = new Headers(init.headers);
		headers.set("host", config.resource.host);
		if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
		return app.fetch(
			new Request(new URL(path, config.resource), { ...init, headers }),
		);
	}
	async function client(accessToken: string) {
		const connection = new Client({ name: "test", version: "1.0.0" });
		const transport = new StreamableHTTPClientTransport(config.resource, {
			requestInit: { headers: { authorization: `Bearer ${accessToken}` } },
			fetch: async (url, init) => {
				const req = new Request(url, init);
				req.headers.set("host", config.resource.host);
				return app.fetch(req);
			},
		});
		await connection.connect(transport);
		return connection;
	}
	return { deps, reads, rss, writes, uploads, request, client };
}

test("publishes resource metadata without authentication, with the real Auth0 issuer", async () => {
	const { request } = setup();
	for (const path of [
		"/.well-known/oauth-protected-resource/mcp",
		"/.well-known/oauth-protected-resource",
	]) {
		const response = await request(path);
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			resource: config.resource.href,
			authorization_servers: [config.issuer],
			scopes_supported: ["content:read", "content:create"],
		});
	}
	expect(
		(await request("/.well-known/oauth-authorization-server")).status,
	).toBe(404);
	expect(
		(
			await request("/.well-known/oauth-protected-resource/mcp", undefined, {
				method: "POST",
			})
		).status,
	).toBe(405);
});

test("requires authentication on every MCP HTTP method and advertises discovery", async () => {
	const { request } = setup();
	for (const method of ["POST", "GET", "DELETE"]) {
		const response = await request("/mcp", undefined, { method });
		expect(response.status).toBe(401);
		expect(response.headers.get("www-authenticate")).toContain(
			'resource_metadata="https://api.example.test/.well-known/oauth-protected-resource/mcp"',
		);
	}
});

test.each([
	{ scope: "other" },
	{ scope: undefined },
	{ scope: 123 },
	{ permissions: ["content:read"], scope: "" },
])(
	"rejects missing delegated scope even when permissions claim grants it: %j",
	async (claims) => {
		const { request } = setup();
		const response = await request("/mcp", await token(claims));
		expect(response.status).toBe(403);
		expect(response.headers.get("www-authenticate")).toContain(
			"insufficient_scope",
		);
	},
);

test.each([
	{ exp: 1 },
	{ iss: "https://wrong.example/" },
	{ aud: "mobile-api" },
	{ azp: "unknown" },
	{ azp: undefined },
	{ client_id: "different", azp: "test-client" },
	{ sub: "auth0|unlinked" },
	{ sub: "test-client@clients" },
	{ gty: "client-credentials" },
	{ sub: "" },
	{ nbf: Math.floor(Date.now() / 1000) + 7200 },
])("rejects invalid identity or claims: %j", async (claims) => {
	const { request } = setup();
	expect((await request("/mcp", await token(claims))).status).toBe(401);
});

test("rejects forged signatures and malformed tokens; hides infrastructure failure", async () => {
	const { request, deps } = setup();
	for (const value of [await token({}, secondKeys.privateKey), "not-a-jwt"]) {
		expect((await request("/mcp", value)).status).toBe(401);
	}
	jwks.failed = true;
	const response = await request("/mcp", await token());
	expect(response.status).toBe(500);
	expect(await response.text()).not.toContain("sensitive");
	expect(deps.reportError).toHaveBeenCalled();
});

test("supports RFC9068 client_id and preserves mobile audience isolation", async () => {
	const { client } = setup();
	const connection = await client(
		await token({ client_id: "test-client", azp: undefined }),
	);
	expect((await connection.listTools()).tools).toHaveLength(18);
	await connection.close();
	await expect(
		verifyMobileToken(
			await token({ aud: "mobile-api" }),
			config.issuer,
			"mobile-api",
		),
	).resolves.toBe("auth0|alice");
	await expect(
		verifyMobileToken(await token(), config.issuer, "mobile-api"),
	).rejects.toThrow("UNAUTHORIZED");
});

test("rejects untrusted hosts and exact origins; allows approved CORS preflight", async () => {
	const { request } = setup();
	for (const origin of [
		"https://evil.test",
		"http://inspector.example.test",
		"https://inspector.example.test:444",
		"null",
	]) {
		expect(
			(await request("/mcp", undefined, { headers: { origin } })).status,
		).toBe(403);
	}
	const response = await request("/mcp", undefined, {
		method: "OPTIONS",
		headers: {
			origin: config.origins[1],
			"access-control-request-method": "POST",
			"access-control-request-headers":
				"authorization,content-type,mcp-protocol-version,mcp-method,mcp-name",
		},
	});
	expect(response.status).toBe(204);
	expect(response.headers.get("access-control-allow-origin")).toBe(
		config.origins[1],
	);
	expect(
		response.headers.get("access-control-allow-headers")?.toLowerCase(),
	).toContain("mcp-method");
	expect(
		response.headers.get("access-control-allow-headers")?.toLowerCase(),
	).toContain("mcp-name");
	const { deps } = setup();
	expect(
		(
			await createMcpApp(config, deps).fetch(
				new Request(config.resource, { headers: { host: "evil.test" } }),
			)
		).status,
	).toBe(403);
});

test("official SDK can list all tools and call existing read tools without exposing paths or credentials", async () => {
	const { client, deps } = setup();
	const connection = await client(await token());
	try {
		const list = await connection.listTools();
		expect(list.tools).toHaveLength(18);
		for (const tool of list.tools) {
			expect(tool.annotations?.readOnlyHint).toBe(
				![
					"create_article",
					"create_note",
					"start_upload",
					"put_upload_chunk",
					"complete_upload",
					"subscribe_rss",
					"save_rss",
					"import_rss",
				].includes(tool.name),
			);
			expect(tool.annotations?.destructiveHint).toBe(false);
		}
		for (const [name, args] of [
			["search_content", { query: "private search" }],
			["list_content", { domain: "notes" }],
			["get_content", { domain: "images", id: "alice-note" }],
			["count_content", { domain: "books" }],
			["list_categories", {}],
			["list_rss", {}],
			["get_book_by_isbn", { isbn: "9784065212345" }],
			["get_note_by_title", { title: "alice title" }],
		] as const) {
			const result = await connection.callTool({ name, arguments: args });
			expect(result.isError).not.toBe(true);
			expect(result.structuredContent).toBeDefined();
			expect(JSON.stringify(result)).not.toMatch(
				/internal\/|imagePath|"path"|Bearer/u,
			);
		}
		expect(JSON.stringify(deps.telemetry.log.mock.calls)).not.toMatch(
			/private search|private body|auth0\|alice/u,
		);
		expect(deps.telemetry.duration).toHaveBeenCalled();
	} finally {
		await connection.close();
	}
});

test("keeps concurrent users isolated for list, detail and search", async () => {
	const { client } = setup();
	const [alice, bob] = await Promise.all([
		client(await token()),
		client(await token({ sub: "auth0|bob" })),
	]);
	try {
		await Promise.all(
			(
				[
					[alice, "alice", "bob"],
					[bob, "bob", "alice"],
				] as const
			).map(async ([connection, owner, other]) => {
				const c = connection;
				for (const [name, args] of [
					["list_content", { domain: "notes" }],
					["get_content", { domain: "notes", id: `${owner}-note` }],
					["search_content", { query: "search" }],
					["list_rss", {}],
				] as const) {
					const result = await c.callTool({ name, arguments: args });
					expect(JSON.stringify(result)).toContain(owner);
					expect(JSON.stringify(result)).not.toContain(other);
				}
				const result = await c.callTool({
					name: "get_content",
					arguments: { domain: "notes", id: `${other}-note` },
				});
				expect(result.isError).toBe(true);
				expect(JSON.stringify(result)).toContain("NOT_FOUND");
			}),
		);
		expect(tenantContext.getStore()).toBeUndefined();
	} finally {
		await Promise.all([alice.close(), bob.close()]);
	}
});

test("validates limits/arguments, hides tool failures and rejects unknown mutation tools", async () => {
	const { client, reads, deps } = setup();
	const connection = await client(await token());
	try {
		for (const [name, args] of [
			["list_content", { domain: "notes", limit: 101 }],
			["search_content", { query: "q", limit: 51 }],
			["search_content", { query: "" }],
			["list_content", { domain: "notes", userId: "bob" }],
			["get_content", { domain: "invalid", id: "x" }],
		] as const) {
			const result = await connection.callTool({ name, arguments: args });
			expect(result.isError).toBe(true);
		}
		await expect(
			connection.callTool({ name: "delete_content", arguments: { id: "x" } }),
		).rejects.toThrow("not found");
		expect(reads.page).not.toHaveBeenCalled();
		reads.search.mockRejectedValueOnce(new Error("private database contents"));
		const result = await connection.callTool({
			name: "search_content",
			arguments: { query: "q" },
		});
		expect(result.isError).toBe(true);
		expect(JSON.stringify(result)).toContain("INTERNAL_ERROR");
		expect(JSON.stringify(result)).not.toContain("private database");
		expect(JSON.stringify(deps.reportError.mock.calls)).not.toContain(
			"private database",
		);
	} finally {
		await connection.close();
	}
});

test("MCP and metadata remain absent when the backend has no MCP handler", async () => {
	const empty = async () => new Response(null, { status: 204 });
	const app = createBackendHttpApp({
		api: empty,
		auth: empty,
		cron: empty,
		signIn: empty,
		isTrustedOrigin: () => false,
		reportError: vi.fn(),
	});
	for (const path of ["/mcp", "/.well-known/oauth-protected-resource/mcp"]) {
		expect((await app.request(`https://api.example.test${path}`)).status).toBe(
			404,
		);
	}
});

test("RSS listing preserves results across repeated calls, forwards pagination and supports empty pages", async () => {
	const { client, rss } = setup();
	const connection = await client(await token());
	try {
		const tool = (await connection.listTools()).tools.find(
			(item) => item.name === "list_rss",
		);
		expect(tool?.annotations).toMatchObject({
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: false,
		});
		for (let i = 0; i < 2; i++) {
			const result = await connection.callTool({
				name: "list_rss",
				arguments: {},
			});
			expect(result.isError).not.toBe(true);
			expect(result.structuredContent).toEqual(rssPage("alice"));
		}
		expect(rss.page).toHaveBeenLastCalledWith(
			"alice",
			0,
			undefined,
			"all",
			undefined,
		);
		rss.page.mockResolvedValueOnce({
			...rssPage("alice"),
			unread: [],
			saved: [],
		});
		const result = await connection.callTool({
			name: "list_rss",
			arguments: { offset: 50, feedId },
		});
		expect(result.structuredContent).toMatchObject({
			unread: [],
			saved: [],
			unreadCount: 1,
			savedCount: 1,
		});
		expect(rss.page).toHaveBeenLastCalledWith(
			"alice",
			50,
			feedId,
			"all",
			undefined,
		);
	} finally {
		await connection.close();
	}
});

test("RSS listing rejects invalid arguments and hides repository failures", async () => {
	const { client, rss, deps } = setup();
	const connection = await client(await token());
	try {
		for (const args of [
			{ offset: -1 },
			{ offset: 1.5 },
			{ offset: 1000001 },
			{ feedId: "invalid" },
			{ userId: "bob" },
		]) {
			expect(
				(await connection.callTool({ name: "list_rss", arguments: args }))
					.isError,
			).toBe(true);
		}
		expect(rss.page).not.toHaveBeenCalled();
		for (const name of [
			"read_rss",
			"refresh_rss",
			"unsave_rss",
			"unsubscribe_rss",
		]) {
			await expect(
				connection.callTool({ name, arguments: {} }),
			).rejects.toThrow("not found");
		}
		rss.page.mockRejectedValueOnce(new Error("private RSS database contents"));
		const result = await connection.callTool({
			name: "list_rss",
			arguments: {},
		});
		expect(result.isError).toBe(true);
		expect(JSON.stringify(result)).toContain("INTERNAL_ERROR");
		expect(JSON.stringify(result)).not.toContain("private RSS");
		expect(deps.reportError).toHaveBeenCalled();
	} finally {
		await connection.close();
	}
});

function rssTestDatabaseUrl() {
	const connectionString = process.env.RSS_TEST_DATABASE_URL!;
	const url = new URL(connectionString);
	if (
		!url.pathname.startsWith("/rss_worktree_") ||
		!["localhost", "127.0.0.1"].includes(url.hostname)
	)
		throw new Error("Use a dedicated RSS test database");
	return connectionString;
}

test.skipIf(!process.env.RSS_TEST_DATABASE_URL)(
	"MCP RSS reads leave all persisted RSS state unchanged",
	async () => {
		const connectionString = rssTestDatabaseUrl();
		const { PrismaClient, PrismaPg } = await import("@s-hirano-ist/s-database");
		const { extendDatabase } =
			await import("@s-hirano-ist/s-infrastructure/database");
		const { applyTenantFilter } =
			await import("@s-hirano-ist/s-infrastructure/shared/tenant-filter");
		const { createRssRepository } =
			await import("@s-hirano-ist/s-infrastructure/rss/repository");
		const { createRssService } =
			await import("@s-hirano-ist/s-application/rss/service");
		const db = new PrismaClient({
			adapter: new PrismaPg({ connectionString }),
		});
		const repository = createRssRepository(
			extendDatabase(
				db,
				(model, operation, args) =>
					applyTenantFilter(model, operation, args, tenantContext.getStore()),
				() => {},
			),
		);
		const fetchFeed = vi.fn();
		const reportFailure = vi.fn();
		const service = createRssService(repository, fetchFeed, reportFailure);
		const { client } = setup(service.page);
		const where = { userId: { in: ["alice", "bob"] } };
		const snapshot = async () => ({
			feeds: await db.rssFeed.findMany({ where, orderBy: { id: "asc" } }),
			unread: await db.rssUnread.findMany({ where, orderBy: { id: "asc" } }),
			saved: await db.rssSaved.findMany({ where, orderBy: { id: "asc" } }),
			seen: await db.rssSeen.findMany({
				where: { feed: where },
				orderBy: [{ feedId: "asc" }, { hash: "asc" }],
			}),
		});
		const connections: Awaited<ReturnType<typeof client>>[] = [];
		const createdFeeds: string[] = [];
		const createdSaved: string[] = [];
		try {
			for (const owner of ["alice", "bob"]) {
				const feed = await db.rssFeed.create({
					data: {
						id: randomUUID(),
						userId: owner,
						title: `${owner} feed`,
						url: `https://example.test/${owner}/mcp-feed`,
						folder: "Tech",
					},
				});
				createdFeeds.push(feed.id);
				const entry = {
					userId: owner,
					title: `${owner} article`,
					url: `https://example.test/${owner}/mcp-article`,
				};
				await db.rssUnread.create({
					data: {
						...entry,
						id: randomUUID(),
						feedId: feed.id,
						receivedAt: new Date(),
					},
				});
				createdSaved.push(
					(
						await db.rssSaved.create({
							data: { ...entry, id: randomUUID(), savedAt: new Date() },
						})
					).id,
				);
				await db.rssSeen.create({
					data: {
						feedId: feed.id,
						hash: new Uint8Array(32).fill(1),
					},
				});
			}
			const before = await snapshot();
			const alice = await client(await token());
			connections.push(alice);
			const bob = await client(await token({ sub: "auth0|bob" }));
			connections.push(bob);
			for (let i = 0; i < 2; i++) {
				for (const [connection, owner, other] of [
					[alice, "alice", "bob"],
					[bob, "bob", "alice"],
				] as const) {
					const result = await connection.callTool({
						name: "list_rss",
						arguments: {},
					});
					expect(result.isError).not.toBe(true);
					expect(result.structuredContent).toMatchObject({
						unreadCount: 1,
						savedCount: 1,
					});
					expect(JSON.stringify(result)).toContain(owner);
					expect(JSON.stringify(result)).not.toContain(other);
				}
			}
			const filtered = await alice.callTool({
				name: "list_rss",
				arguments: { feedId: createdFeeds[1] },
			});
			expect(filtered.structuredContent).toMatchObject({
				unread: [],
				unreadCount: 0,
				savedCount: 1,
			});
			expect(JSON.stringify(filtered)).not.toContain("bob");
			const nextPage = await alice.callTool({
				name: "list_rss",
				arguments: { offset: 50 },
			});
			expect(nextPage.structuredContent).toMatchObject({
				unread: [],
				saved: [],
				unreadCount: 1,
				savedCount: 1,
			});
			expect(await snapshot()).toEqual(before);
			expect(fetchFeed).not.toHaveBeenCalled();
			expect(reportFailure).not.toHaveBeenCalled();
		} finally {
			await Promise.all(connections.map((connection) => connection.close()));
			await db.rssFeed.deleteMany({ where: { id: { in: createdFeeds } } });
			await db.rssSaved.deleteMany({ where: { id: { in: createdSaved } } });
			await db.$disconnect();
		}
	},
);

const mutationCalls = [
	[
		"create_article",
		{
			operationId: feedId,
			title: "Article",
			url: "https://example.com/article",
			category: "Tech",
		},
	],
	["create_note", { operationId: feedId, title: "Note", markdown: "# Body" }],
	[
		"start_upload",
		{
			upload: {
				operationId: feedId,
				domain: "images",
				contentType: "image/png",
				fileSize: 3,
				metadata: { filename: "image.png" },
			},
		},
	],
	["put_upload_chunk", { id: "alice-upload", part: 0, data: "YWJj" }],
	["complete_upload", { id: "alice-upload" }],
	[
		"subscribe_rss",
		{ title: "Feed", url: "https://example.com/feed", folder: "Tech" },
	],
	[
		"save_rss",
		{ title: "Saved", url: "https://example.com/saved", publishedAt: null },
	],
	[
		"import_rss",
		{
			kind: "opml",
			content:
				'<opml><body><outline title="Feed" xmlUrl="https://example.com/import"/></body></opml>',
		},
	],
] as const;

test("read-only tokens cannot execute any additions; create-only tokens cannot read", async () => {
	const { client, writes, uploads, rss, reads } = setup();
	const readOnly = await client(await token());
	const createOnly = await client(await token({ scope: "content:create" }));
	try {
		for (const [name, args] of mutationCalls) {
			await expect(
				readOnly.callTool({ name, arguments: args }),
			).rejects.toThrow(/Insufficient scope/u);
			const result = await createOnly.callTool({ name, arguments: args });
			expect(result.isError).not.toBe(true);
			expect(result.structuredContent).toBeDefined();
		}
		await expect(
			createOnly.callTool({
				name: "list_content",
				arguments: { domain: "notes" },
			}),
		).rejects.toThrow(/Insufficient scope/u);
		expect(reads.page).not.toHaveBeenCalled();
		for (const mock of [
			writes.article,
			writes.note,
			uploads.start,
			uploads.put,
			uploads.complete,
			rss.subscribe,
			rss.save,
			rss.import,
		])
			expect(mock).toHaveBeenCalledTimes(1);
		expect(uploads.put).toHaveBeenCalledWith(
			"alice",
			"alice-upload",
			0,
			Buffer.from("abc"),
		);
		expect(rss.import).toHaveBeenCalledWith("alice", {
			feeds: [{ title: "Feed", url: "https://example.com/import", folder: "" }],
			saved: [],
			invalid: 0,
		});
	} finally {
		await Promise.all([readOnly.close(), createOnly.close()]);
	}
});

test("media byte pages and upload state require ownership and preserve data", async () => {
	const { client, reads, uploads } = setup();
	const connection = await client(await token());
	try {
		for (const domain of ["images", "books"]) {
			const page = await connection.callTool({
				name: "get_media",
				arguments: {
					domain,
					id: "alice-image",
					variant: "original",
					length: 3,
				},
			});
			expect(page.structuredContent).toEqual({
				data: "YWJj",
				mimeType: "image/png",
				byteLength: 3,
				offset: 0,
				nextOffset: 3,
			});
			const last = await connection.callTool({
				name: "get_media",
				arguments: {
					domain,
					id: "alice-image",
					variant: "original",
					offset: 3,
					length: 3,
				},
			});
			expect(last.structuredContent).toMatchObject({
				data: "ZGVm",
				byteLength: 3,
				nextOffset: null,
			});
		}
		expect(
			(
				await connection.callTool({
					name: "get_upload",
					arguments: { id: "alice-upload" },
				})
			).isError,
		).not.toBe(true);
		for (const [name, args] of [
			[
				"get_media",
				{ domain: "images", id: "bob-image", variant: "thumbnail" },
			],
			["get_upload", { id: "bob-upload" }],
		] as const) {
			const result = await connection.callTool({ name, arguments: args });
			expect(result.isError).toBe(true);
			expect(result.content).toEqual([{ type: "text", text: "NOT_FOUND" }]);
		}
		expect(reads.media).toHaveBeenCalledWith(
			"alice",
			"images",
			"bob-image",
			"thumbnail",
		);
		expect(uploads.get).toHaveBeenCalledWith("alice", "bob-upload");
	} finally {
		await connection.close();
	}
});

test("rejects malformed additions before service calls and preserves safe failure codes", async () => {
	const { client, writes, uploads, rss, deps } = setup();
	const connection = await client(
		await token({ scope: "content:read content:create" }),
	);
	try {
		for (const data of [
			"a",
			"YQ",
			"YQ=",
			"YR==",
			"data:image/png;base64,YQ==",
			"!!!!",
			"YQ==\n",
			Buffer.alloc(1024 * 1024 + 1).toString("base64"),
		]) {
			expect(
				(
					await connection.callTool({
						name: "put_upload_chunk",
						arguments: { id: "alice-upload", part: 0, data },
					})
				).isError,
			).toBe(true);
		}
		for (const [name, args] of [
			[
				"create_note",
				{ operationId: "invalid", title: "Note", markdown: "body" },
			],
			["create_article", { ...mutationCalls[0][1], owner: "bob" }],
			[
				"start_upload",
				{
					upload: {
						...mutationCalls[2][1].upload,
						fileSize: 10 * 1024 * 1024 + 1,
					},
				},
			],
			["put_upload_chunk", { id: "alice-upload", part: -1, data: "YQ==" }],
			["subscribe_rss", { title: "Feed", url: "file:///private", folder: "" }],
			["save_rss", { ...mutationCalls[6][1], userId: "bob" }],
			["import_rss", { kind: "opml", content: "invalid" }],
			[
				"get_media",
				{
					domain: "images",
					id: "alice-image",
					variant: "original",
					length: 1024 * 1024 + 1,
				},
			],
		] as const)
			expect(
				(await connection.callTool({ name, arguments: args })).isError,
			).toBe(true);
		for (const mock of [
			writes.article,
			writes.note,
			uploads.start,
			uploads.put,
			rss.subscribe,
			rss.save,
			rss.import,
		])
			expect(mock).not.toHaveBeenCalled();
		for (const code of [
			"DUPLICATE",
			"OPERATION_CONFLICT",
			"OPERATION_IN_PROGRESS",
			"UPLOAD_INCOMPLETE",
			"UPLOAD_EXPIRED",
			"INVALID_CHUNK_SIZE",
		] as const) {
			uploads.complete.mockRejectedValueOnce(new ApplicationError(code));
			const result = await connection.callTool({
				name: "complete_upload",
				arguments: { id: "alice-upload" },
			});
			expect(result).toMatchObject({
				isError: true,
				content: [{ type: "text", text: code }],
			});
		}
		writes.note.mockRejectedValueOnce(
			new Error("private input and storage details"),
		);
		const failure = await connection.callTool({
			name: "create_note",
			arguments: mutationCalls[1][1],
		});
		expect(failure).toMatchObject({
			isError: true,
			content: [{ type: "text", text: "INTERNAL_ERROR" }],
		});
		expect(JSON.stringify(deps.reportError.mock.calls)).not.toContain(
			"private input",
		);
		for (const name of [
			"delete_content",
			"update_content",
			"cancel_upload",
			"mark_rss_read",
			"refresh_rss",
			"unsave_rss",
			"unsubscribe_rss",
			"export_content",
			"get_sync_head",
			"get_push_status",
		]) {
			await expect(
				connection.callTool({ name, arguments: {} }),
			).rejects.toThrow("not found");
		}
	} finally {
		await connection.close();
	}
});

test("accepts a full base64 chunk and rejects oversized HTTP bodies without adding data", async () => {
	const { request, client, uploads, writes } = setup();
	const accessToken = await token({ scope: "content:create" });
	const connection = await client(accessToken);
	try {
		const result = await connection.callTool({
			name: "put_upload_chunk",
			arguments: {
				id: "alice-upload",
				part: 0,
				data: Buffer.alloc(1024 * 1024).toString("base64"),
			},
		});
		expect(result.isError).not.toBe(true);
		expect(uploads.put).toHaveBeenCalledTimes(1);
		const response = await request("/mcp", accessToken, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				accept: "application/json, text/event-stream",
			},
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: 1,
				method: "tools/call",
				params: {
					name: "create_note",
					arguments: {
						operationId: feedId,
						title: "Note",
						markdown: "x".repeat(4 * 1024 * 1024),
					},
				},
			}),
		});
		expect(response.status).toBe(413);
		expect(writes.note).not.toHaveBeenCalled();
	} finally {
		await connection.close();
	}
});
