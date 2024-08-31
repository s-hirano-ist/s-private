import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const {
	auth,
	signIn,
	signOut,
	handlers: { GET, POST },
} = NextAuth({
	...authConfig,
	session: { strategy: "jwt" },
	callbacks: {
		jwt: ({ token }) => token,
		session: ({ session }) => {
			return { ...session, user: { ...session.user } };
		},
	},
});
