import NextAuth, { type DefaultSession } from "next-auth";
import { env } from "@/env";
import { UnexpectedError } from "@/utils/error/error-classes";
import authConfig from "./auth.config";

type Role = "viewer" | "dumper";
type Id = string;

declare module "next-auth" {
	// eslint-disable-next-line
	interface Session extends DefaultSession {
		user: {
			id: Id;
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
	handlers: { GET, POST },
} = NextAuth({
	...authConfig,
	trustHost: true,
	secret: env.AUTH_SECRET,
	session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
	jwt: { maxAge: 30 * 24 * 60 * 60 },
	callbacks: {
		jwt({ account, token, profile }) {
			if (account && profile) {
				const namespace = "https://private.s-hirano.com/";
				token.roles = profile[`${namespace}roles`] || [];
				token.id = profile.sub;
			}
			return token;
		},
		session({ session, token }) {
			if (token) {
				if (!token.id) throw new UnexpectedError();
				session.user.id = token.id as Id;
				session.user.roles = token.roles as Role[];
			}
			return session;
		},
	},
});
