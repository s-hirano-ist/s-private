import { env } from "@/env";
import { UnexpectedError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import NextAuth, { type DefaultSession } from "next-auth";
import authConfig from "./auth-config";

type Id = string;

declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: Id;
		} & DefaultSession["user"];
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
				token.id = profile.sub;
			}
			return token;
		},
		session({ session, token }) {
			// oxlint-disable-next-line typescript/no-unnecessary-condition -- token is from next-auth callback (external runtime boundary); declared non-nullable but may be absent at runtime
			if (token) {
				if (!token.id) throw new UnexpectedError();
				session.user.id = token.id as Id;
			}
			return session;
		},
	},
});
