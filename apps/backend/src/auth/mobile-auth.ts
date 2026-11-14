import type { MobileDeps } from "@s-hirano-ist/s-application/mobile/deps";
import { tenantContext } from "@s-hirano-ist/s-infrastructure/shared/tenant-context";
import { ApiError } from "s-private-backend/api/error";
import { verifyAccessToken } from "s-private-backend/auth/access-token";
export async function verifyMobileToken(
	token: string,
	issuer: string,
	audience: string,
): Promise<string> {
	try {
		const payload = await verifyAccessToken(token, issuer, audience);
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
