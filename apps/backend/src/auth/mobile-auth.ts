import type { MobileDeps } from "@s-hirano-ist/s-application/mobile/deps";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ApiError } from "s-private-backend/api/error";
import { tenantContext } from "s-private-backend/shared/tenant-context";
const resolvers = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export async function verifyMobileToken(
	token: string,
	issuer: string,
	audience: string,
): Promise<string> {
	try {
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
		if (!protectedHeader.kid || !payload.sub) throw new Error("Invalid claims");
		return payload.sub;
	} catch {
		throw new ApiError("UNAUTHORIZED");
	}
}
export type MobileAuthConfig = {
	AUTH0_ISSUER_BASE_URL?: string;
	MOBILE_API_AUDIENCE?: string;
};
export async function authenticateMobileRequest(
	request: Request,
	config: MobileAuthConfig,
	deps: Pick<MobileDeps, "accounts">,
): Promise<string> {
	const issuer = config.AUTH0_ISSUER_BASE_URL;
	const audience = config.MOBILE_API_AUDIENCE;
	if (!issuer || !audience) throw new ApiError("API_UNAVAILABLE");
	const match = /^Bearer (\S+)$/u.exec(
		request.headers.get("authorization") ?? "",
	);
	if (!match) throw new ApiError("UNAUTHORIZED");
	const subject = await verifyMobileToken(match[1], issuer, audience);
	const userId = await deps.accounts.findLinkedUser(subject);
	if (!userId) throw new ApiError("FORBIDDEN");
	return userId;
}
export async function withMobileTenant<T>(
	request: Request,
	fn: (userId: string) => Promise<T>,
	config: MobileAuthConfig,
	deps: Pick<MobileDeps, "accounts">,
): Promise<T> {
	const userId = await authenticateMobileRequest(request, config, deps);
	return tenantContext.run({ userId }, () => fn(userId));
}
