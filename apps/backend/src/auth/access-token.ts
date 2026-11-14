import type { JWTPayload } from "jose";
import { createRemoteJWKSet, jwtVerify, errors } from "jose";

const resolvers = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/** Shared Auth0 JWT validation; each transport supplies its own audience. */
export async function verifyAccessToken(
	token: string,
	issuer: string,
	audience: string,
): Promise<JWTPayload & { sub: string }> {
	const canonicalIssuer = issuer.endsWith("/") ? issuer : `${issuer}/`;
	const url = new URL(canonicalIssuer);
	if (url.protocol !== "https:") throw new Error("Invalid issuer");
	let keys = resolvers.get(canonicalIssuer);
	if (!keys) {
		keys = createRemoteJWKSet(new URL(".well-known/jwks.json", url), {
			cacheMaxAge: 300_000,
			timeoutDuration: 5_000,
		});
		if (resolvers.size >= 4) resolvers.clear();
		resolvers.set(canonicalIssuer, keys);
	}
	const { payload, protectedHeader } = await jwtVerify(token, keys, {
		issuer: canonicalIssuer,
		audience,
		algorithms: ["RS256"],
		requiredClaims: ["exp", "sub", "iss", "aud"],
	});
	if (!protectedHeader.kid || typeof payload.sub !== "string" || !payload.sub)
		throw new errors.JWTClaimValidationFailed("Invalid claims", payload);
	return { ...payload, sub: payload.sub };
}
