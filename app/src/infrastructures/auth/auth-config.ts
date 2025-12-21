/**
 * NextAuth.js configuration for Auth0 authentication.
 *
 * @remarks
 * Configures Auth0 as the authentication provider using environment variables.
 *
 * @module
 */

import type { NextAuthConfig } from "next-auth";
import Auth0 from "next-auth/providers/auth0";
import { env } from "@/env";

/**
 * NextAuth configuration object.
 *
 * @remarks
 * Uses Auth0 provider with credentials from environment variables.
 */
export default {
	providers: [
		Auth0({
			clientId: env.AUTH0_CLIENT_ID,
			clientSecret: env.AUTH0_CLIENT_SECRET,
			issuer: env.AUTH0_ISSUER_BASE_URL,
		}),
	],
} satisfies NextAuthConfig;
