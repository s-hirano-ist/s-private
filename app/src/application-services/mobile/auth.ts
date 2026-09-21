import "server-only";
import { tenantContext } from "@/common/tenant/tenant-context";
import { env } from "@/env";
import prisma from "@/prisma";
import { createPublicKey, verify, type JsonWebKey } from "node:crypto";

export class MobileApiError extends Error {
	constructor(
		public readonly code: string,
		public readonly status: number,
	) {
		super(code);
	}
}

type JwtHeader = { alg?: string; kid?: string; typ?: string };
type JwtClaims = {
	aud?: string | string[];
	exp?: number;
	iss?: string;
	nbf?: number;
	sub?: string;
};
type Jwk = JsonWebKey & {
	alg?: string;
	kid?: string;
	kty?: string;
	use?: string;
};

function decodePart(part: string): unknown {
	return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as unknown;
}

function validateClaims(
	claims: JwtClaims,
	issuer: string,
	audience: string,
): string {
	const now = Math.floor(Date.now() / 1000);
	const audienceMatches = Array.isArray(claims.aud)
		? claims.aud.includes(audience)
		: claims.aud === audience;
	if (
		claims.iss !== issuer ||
		!audienceMatches ||
		typeof claims.exp !== "number" ||
		claims.exp <= now ||
		(claims.nbf !== undefined && claims.nbf > now) ||
		!claims.sub
	)
		throw new Error("Invalid claims");
	return claims.sub;
}

/** Verifies an Auth0 RS256 access token using the issuer's public JWKS. */
export async function verifyMobileToken(
	token: string,
	issuer: string,
	audience: string,
): Promise<string> {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) throw new Error("Malformed JWT");
		const [encodedHeader, encodedClaims, encodedSignature] = parts as [
			string,
			string,
			string,
		];
		const header = decodePart(encodedHeader) as JwtHeader;
		const claims = decodePart(encodedClaims) as JwtClaims;
		if (header.alg !== "RS256" || !header.kid)
			throw new Error("Unsupported JWT");
		const canonicalIssuer = issuer.endsWith("/") ? issuer : `${issuer}/`;
		const expectedOrigin = new URL(canonicalIssuer);
		if (expectedOrigin.protocol !== "https:") throw new Error("Invalid issuer");
		const jwksResponse = await fetch(
			new URL(".well-known/jwks.json", canonicalIssuer),
			{ next: { revalidate: 300 } },
		);
		if (!jwksResponse.ok) throw new Error("JWKS unavailable");
		const jwks = (await jwksResponse.json()) as { keys?: Jwk[] };
		const key = jwks.keys?.find(
			(candidate) =>
				candidate.kid === header.kid &&
				candidate.kty === "RSA" &&
				(candidate.use === undefined || candidate.use === "sig") &&
				(candidate.alg === undefined || candidate.alg === "RS256"),
		);
		if (!key) throw new Error("Unknown key");
		const valid = verify(
			"RSA-SHA256",
			Buffer.from(`${encodedHeader}.${encodedClaims}`),
			createPublicKey({ key, format: "jwk" }),
			Buffer.from(encodedSignature, "base64url"),
		);
		if (!valid) throw new Error("Invalid signature");
		return validateClaims(claims, canonicalIssuer, audience);
	} catch {
		throw new MobileApiError("UNAUTHORIZED", 401);
	}
}

/** Maps a native Auth0 subject to the already linked Better Auth account. */
export async function authenticateMobileRequest(
	request: Request,
): Promise<string> {
	const issuer = env.AUTH0_ISSUER_BASE_URL;
	const audience = env.MOBILE_API_AUDIENCE;
	if (!issuer || !audience) {
		throw new MobileApiError("MOBILE_API_UNAVAILABLE", 503);
	}
	const authorization = request.headers.get("authorization");
	const match = /^Bearer (\S+)$/u.exec(authorization ?? "");
	if (!match) throw new MobileApiError("UNAUTHORIZED", 401);
	const subject = await verifyMobileToken(match[1], issuer, audience);
	const accounts = await prisma.account.findMany({
		where: { providerId: "auth0", accountId: subject },
		select: { userId: true },
		take: 2,
	});
	if (accounts.length !== 1 || !accounts[0]?.userId) {
		throw new MobileApiError("FORBIDDEN", 403);
	}
	return accounts[0].userId;
}

export async function withMobileTenant<T>(
	request: Request,
	fn: (userId: string) => Promise<T>,
): Promise<T> {
	const userId = await authenticateMobileRequest(request);
	return tenantContext.run({ userId }, () => fn(userId));
}
