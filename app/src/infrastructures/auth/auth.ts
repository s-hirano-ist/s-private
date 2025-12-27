import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins";
import { env } from "@/env";

export type Role = "viewer" | "dumper";

const ROLE_NAMESPACE = "https://private.s-hirano.com/roles";

export const auth = betterAuth({
	basePath: "/api/auth",
	secret: env.AUTH_SECRET,
	trustedOrigins: ["*"],

	// Stateless session (DBなし)
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 30 * 24 * 60 * 60, // 30日
		},
	},

	plugins: [
		nextCookies(),
		genericOAuth({
			config: [
				{
					providerId: "auth0",
					discoveryUrl: `${env.AUTH0_ISSUER_BASE_URL}/.well-known/openid-configuration`,
					clientId: env.AUTH0_CLIENT_ID,
					clientSecret: env.AUTH0_CLIENT_SECRET,
					scopes: ["openid", "profile", "email"],
					pkce: true,
					mapProfileToUser: (profile) => ({
						id: profile.sub as string,
						email: profile.email as string,
						name: profile.name as string,
						image: profile.picture as string | undefined,
					}),
				},
			],
		}),
	],
});

// Auth0プロファイルからロールを取得するヘルパー
export function getRolesFromProfile(profile: Record<string, unknown>): Role[] {
	const roles = profile[ROLE_NAMESPACE];
	if (Array.isArray(roles)) {
		return roles.filter(
			(role): role is Role => role === "viewer" || role === "dumper",
		);
	}
	return [];
}
