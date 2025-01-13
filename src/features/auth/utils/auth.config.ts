import { env } from "@/env.mjs";
import type { NextAuthConfig } from "next-auth";
import Auth0 from "next-auth/providers/auth0";

export default {
	providers: [
		Auth0({
			clientId: env.AUTH0_ID,
			clientSecret: env.AUTH0_SECRET,
			issuer: env.AUTH0_ISSUER,
		}),
	],
} satisfies NextAuthConfig;
