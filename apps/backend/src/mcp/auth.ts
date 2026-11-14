import type { AuthInfo } from "@modelcontextprotocol/server";
import type { MobileDeps } from "@s-hirano-ist/s-application/mobile/deps";
import type { McpConfig } from "s-private-backend/mcp/config";
import { OAuthError, OAuthErrorCode } from "@modelcontextprotocol/server";
import { errors } from "jose";
import { verifyAccessToken } from "s-private-backend/auth/access-token";

export const MCP_SCOPE = "content:read";

export function createMcpTokenVerifier(
	config: McpConfig,
	accounts: MobileDeps["accounts"],
) {
	return {
		async verifyAccessToken(token: string): Promise<AuthInfo> {
			let payload;
			try {
				payload = await verifyAccessToken(
					token,
					config.issuer,
					config.resource.href,
				);
			} catch (error) {
				if (
					error instanceof errors.JOSEError &&
					!(error instanceof errors.JWKSTimeout)
				)
					throw new OAuthError(
						OAuthErrorCode.InvalidToken,
						"Invalid access token",
					);
				throw error;
			}
			const clientId = payload.client_id ?? payload.azp;
			if (
				typeof clientId !== "string" ||
				!config.clientIds.includes(clientId) ||
				(payload.client_id !== undefined &&
					payload.azp !== undefined &&
					payload.client_id !== payload.azp) ||
				payload.gty === "client-credentials" ||
				payload.sub.endsWith("@clients")
			)
				throw new OAuthError(
					OAuthErrorCode.InvalidToken,
					"Client is not allowed",
				);
			const owner = await accounts.findLinkedUser(payload.sub);
			if (!owner)
				throw new OAuthError(
					OAuthErrorCode.InvalidToken,
					"No linked application account",
				);
			return {
				token,
				clientId,
				scopes:
					typeof payload.scope === "string"
						? payload.scope.split(/\s+/u).filter(Boolean)
						: [],
				expiresAt: payload.exp,
				resource: config.resource,
				extra: { owner },
			};
		},
	};
}
