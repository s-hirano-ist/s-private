import { generateKeyPairSync, sign } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mockedEnv = vi.hoisted(() => ({
	AUTH0_ISSUER_BASE_URL: "https://example.auth0.com/",
	MOBILE_API_AUDIENCE: "https://api.example.test",
	MOBILE_OWNER_USER_ID: "owner-1",
}));
vi.mock("@/env", () => ({ env: mockedEnv }));
const accountFindMany = vi.hoisted(() => vi.fn());
vi.mock("@/prisma", () => ({
	default: { account: { findMany: accountFindMany } },
}));

const { authenticateMobileRequest, verifyMobileToken } = await import("./auth");
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
	modulusLength: 2048,
});
const jwk = publicKey.export({ format: "jwk" });

function token(
	overrides: Record<string, unknown> = {},
	key = privateKey,
): string {
	const header = Buffer.from(
		JSON.stringify({ alg: "RS256", kid: "key-1" }),
	).toString("base64url");
	const claims = Buffer.from(
		JSON.stringify({
			iss: "https://example.auth0.com/",
			aud: "https://api.example.test",
			sub: "auth0|person-1",
			exp: Math.floor(Date.now() / 1000) + 300,
			...overrides,
		}),
	).toString("base64url");
	const signature = sign(
		"RSA-SHA256",
		Buffer.from(`${header}.${claims}`),
		key,
	).toString("base64url");
	return `${header}.${claims}.${signature}`;
}

function request(bearer?: string): Request {
	return new Request("https://example.test/api/mobile/v1/notes", {
		headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
	});
}

describe("mobile bearer authentication", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockImplementation(async () =>
				Response.json({
					keys: [{ ...jwk, kid: "key-1", alg: "RS256", use: "sig" }],
				}),
			),
		);
	});
	afterEach(() => vi.unstubAllGlobals());

	test("accepts a valid Auth0 access token linked to the configured owner", async () => {
		accountFindMany.mockResolvedValue([{ userId: "owner-1" }]);
		await expect(authenticateMobileRequest(request(token()))).resolves.toBe(
			"owner-1",
		);
		expect(accountFindMany).toHaveBeenCalledWith({
			where: { providerId: "auth0", accountId: "auth0|person-1" },
			select: { userId: true },
			take: 2,
		});
	});

	test.each([
		["missing token", undefined],
		["expired token", token({ exp: 1 })],
		["wrong audience", token({ aud: "wrong" })],
		["wrong issuer", token({ iss: "https://other.auth0.com/" })],
		["tampered signature", `${token().slice(0, -4)}aaaa`],
	])("rejects %s", async (_name, bearer) => {
		await expect(
			authenticateMobileRequest(request(bearer)),
		).rejects.toMatchObject({ code: "UNAUTHORIZED", status: 401 });
		expect(accountFindMany).not.toHaveBeenCalled();
	});

	test("rejects an unlinked or different owner's account", async () => {
		accountFindMany.mockResolvedValue([{ userId: "someone-else" }]);
		await expect(
			authenticateMobileRequest(request(token())),
		).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
		accountFindMany.mockResolvedValue([]);
		await expect(
			authenticateMobileRequest(request(token())),
		).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
	});

	test("verifies the JWT signature before returning the subject", async () => {
		await expect(
			verifyMobileToken(
				token(),
				mockedEnv.AUTH0_ISSUER_BASE_URL,
				mockedEnv.MOBILE_API_AUDIENCE,
			),
		).resolves.toBe("auth0|person-1");
	});
});
