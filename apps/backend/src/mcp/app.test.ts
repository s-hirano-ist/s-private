import type { JWTPayload, JSONWebKeySet } from "jose";
import type { ReadService } from "s-private-backend/api/read-service";
import {
	Client,
	StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { tenantContext } from "@s-hirano-ist/s-infrastructure/shared/tenant-context";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
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
function setup() {
	const assertOwner = async (owner: string) => {
		await new Promise<void>((resolve) => {
			setImmediate(resolve);
		});
		expect(tenantContext.getStore()?.userId).toBe(owner);
	};
	const reads = {
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
	const deps = {
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
	return { deps, reads, request, client };
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
			scopes_supported: ["content:read"],
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
	expect((await connection.listTools()).tools).toHaveLength(7);
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

test("official SDK can list/call all seven tools without exposing paths or credentials", async () => {
	const { client, deps } = setup();
	const connection = await client(await token());
	try {
		const list = await connection.listTools();
		expect(list.tools).toHaveLength(7);
		for (const tool of list.tools)
			expect(tool.annotations?.readOnlyHint).toBe(true);
		for (const [name, args] of [
			["search_content", { query: "private search" }],
			["list_content", { domain: "notes" }],
			["get_content", { domain: "images", id: "alice-note" }],
			["count_content", { domain: "books" }],
			["list_categories", {}],
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
