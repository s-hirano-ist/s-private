import type { DatabaseClient } from "s-private-backend/shared/database";
import { createBackendAuth } from "s-private-backend/auth/web-auth";
import { afterEach, expect, test, vi } from "vite-plus/test";

const discovery = {
	issuer: "https://example.auth0.com/",
	authorization_endpoint: "https://example.auth0.com/authorize",
	token_endpoint: "https://example.auth0.com/oauth/token",
	userinfo_endpoint: "https://example.auth0.com/userinfo",
	jwks_uri: "https://example.auth0.com/.well-known/jwks.json",
	id_token_signing_alg_values_supported: ["RS256"],
};

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	vi.useRealTimers();
});

function setup() {
	const failure = vi.fn();
	const recovery = vi.fn();
	const verificationCreate = vi.fn(
		async ({ data }: { data: Record<string, unknown> }) => data,
	);
	const database = {
		verification: { create: verificationCreate },
	} as unknown as DatabaseClient;
	const auth = createBackendAuth(
		{
			LOCAL_DEV_MODE: "false",
			NODE_ENV: "test",
			AUTH_SECRET: "test".repeat(16),
			AUTH0_CLIENT_ID: "test-client",
			AUTH0_CLIENT_SECRET: "secret",
			AUTH0_ISSUER_BASE_URL: "https://example.auth0.com/",
			BETTER_AUTH_URL: "http://localhost:3000",
		},
		database,
		{ failure, recovery },
	);
	return { ...auth, failure, recovery, verificationCreate };
}

test("initializes real Better Auth once and starts OAuth with state cookies", async () => {
	const fetch = vi.fn(async () => Response.json(discovery));
	vi.stubGlobal("fetch", fetch);
	const { getAuth } = setup();
	const [first, second] = await Promise.all([getAuth(), getAuth()]);
	expect(first).toBe(second);
	expect(fetch).toHaveBeenCalledTimes(1);
	const result = await first.api.signInSocial({
		body: { provider: "auth0", callbackURL: "/" },
		headers: new Headers({ host: "localhost:3000" }),
		returnHeaders: true,
	});
	expect(new URL(String(result.response.url)).origin).toBe(
		"https://example.auth0.com",
	);
	expect(result.headers.getSetCookie().length).toBeGreaterThan(0);
	expect(await getAuth()).toBe(first);
});

test("retries discovery failure instead of caching an instance without Auth0", async () => {
	const fetch = vi
		.fn()
		.mockRejectedValueOnce(new TypeError("fetch failed"))
		.mockImplementation(async () => Response.json(discovery));
	vi.stubGlobal("fetch", fetch);
	const { getAuth, failure } = setup();
	const auth = await getAuth();
	expect((await auth.$context).socialProviders.map((p) => p.id)).toContain(
		"auth0",
	);
	expect(fetch).toHaveBeenCalledTimes(2);
	expect(failure).not.toHaveBeenCalled();
});

test.each([
	{},
	{ ...discovery, jwks_uri: undefined },
	{ ...discovery, authorization_endpoint: undefined },
])(
	"rejects incomplete discovery and recovers after cooldown without a process restart: %j",
	async (metadata) => {
		vi.useFakeTimers();
		const fetch = vi.fn(async () => Response.json(metadata));
		vi.stubGlobal("fetch", fetch);
		const { getAuth, failure, recovery } = setup();
		const attempts = Promise.allSettled([getAuth(), getAuth()]);
		await vi.advanceTimersByTimeAsync(250);
		const results = await attempts;
		expect(results.every((r) => r.status === "rejected")).toBe(true);
		expect(failure).toHaveBeenCalledTimes(1);
		await expect(getAuth()).rejects.toMatchObject({
			code: "API_UNAVAILABLE",
			status: 503,
		});
		expect(fetch).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(30_000);
		fetch.mockImplementation(async () => Response.json(discovery));
		await expect(getAuth()).resolves.toBeDefined();
		expect(recovery).toHaveBeenCalledTimes(1);
	},
);

test("local authentication does not perform discovery", async () => {
	const fetch = vi.fn();
	vi.stubGlobal("fetch", fetch);
	const { getAuth } = createBackendAuth(
		{ LOCAL_DEV_MODE: "true", NODE_ENV: "test" },
		{} as DatabaseClient,
		{
			failure: vi.fn(),
			recovery: vi.fn(),
		},
	);
	await getAuth();
	expect(fetch).not.toHaveBeenCalled();
});
