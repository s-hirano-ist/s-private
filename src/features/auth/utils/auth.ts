import { env } from "@/env.mjs";
import NextAuth, { type DefaultSession } from "next-auth";
import authConfig from "./auth.config";

type Role = "viewer" | "dumper";

declare module "next-auth" {
	// eslint-disable-next-line
	interface Session extends DefaultSession {
		user: {
			id: string;
			roles: Role[];
		} & DefaultSession["user"];
	}
	// eslint-disable-next-line
	interface User {
		roles: Role[];
	}
}

export const {
	auth,
	signIn,
	signOut,
	handlers: { GET, POST },
} = NextAuth({
	...authConfig,
	secret: env.AUTH_SECRET,
	session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
	jwt: { maxAge: 30 * 24 * 60 * 60 },
	callbacks: {
		jwt({ account, token, user, profile }) {
			if (account && profile) {
				const namespace = "https://private.s-hirano.com/";
				token.roles = profile[`${namespace}roles`] || [];
			}
			if (user) token.id = user.id;
			return token;
		},
		session({ session, token }) {
			if (token) {
				session.user.id = token.id as string;
				session.user.roles = token.roles as Role[];
			}
			return session;
		},
	},
});
