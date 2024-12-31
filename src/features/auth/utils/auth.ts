import { env } from "@/env.mjs";
import { signInSchema } from "@/features/auth/schemas/sign-in-schema";
import prisma from "@/prisma";
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import authConfig from "./auth.config";

declare module "next-auth" {
	// eslint-disable-next-line
	interface Session extends DefaultSession {
		user: {
			id: string;
			role: string;
			username: string;
		} & DefaultSession["user"];
	}
	// eslint-disable-next-line
	interface User {
		role: Role;
		username: string;
	}
}

// TODO: https://qiita.com/daiki7010/items/b15de9ef747f5b23c984

export const {
	auth,
	signIn,
	signOut,
	handlers: { GET, POST },
} = NextAuth({
	...authConfig,
	secret: env.AUTH_SECRET,
	providers: [
		// MEMO: for manual auth
		// Credentials({
		// 	async authorize(credentials) {
		// 		const parsedCredentials = signInSchema.safeParse(credentials);
		// 		if (parsedCredentials.success) {
		// 			const { username, password } = parsedCredentials.data;

		// 			const user = await prisma.users.findUnique({
		// 				where: { username },
		// 				// MEMO: only allowed to select password here (for auth). See `src/prisma.ts` for more.
		// 				select: {
		// 					id: true,
		// 					username: true,
		// 					role: true,
		// 					password: true,
		// 					isLocked: true,
		// 					failedLoginAttempts: true,
		// 				},
		// 			});

		// 			if (!user) return null;

		// 			// log attempts of auth
		// 			await prisma.loginHistories.create({
		// 				data: { userId: user.id },
		// 			});

		// 			if (user.isLocked) return null;

		// 			const passwordMatch = await bcrypt.compare(password, user.password);

		// 			if (!passwordMatch) {
		// 				await prisma.users.update({
		// 					where: { username },
		// 					data: { failedLoginAttempts: user.failedLoginAttempts + 1 },
		// 				});

		// 				if (user.failedLoginAttempts + 1 >= 3) {
		// 					await prisma.users.update({
		// 						where: { username },
		// 						data: { isLocked: true },
		// 					});
		// 				}
		// 				return null;
		// 			}
		// 			await prisma.users.update({
		// 				where: { username },
		// 				data: { failedLoginAttempts: 0 },
		// 			});
		// 			return { id: user.id, role: user.role, username: user.username };
		// 		}
		// 		return null;
		// 	},
		// }),
		// MEMO: for GitHub Provider
		GitHubProvider({
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		}),
	],
	session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
	jwt: { maxAge: 30 * 24 * 60 * 60 },
	callbacks: {
		jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role;
				token.username = user.username;
			}
			return token;
		},
		session({ session, token }) {
			if (token) {
				session.user.id = token.id as string;
				session.user.role = token.role as Role;
				session.user.username = token.username as string;
			}
			return session;
		},
	},
});
