import type { NextAuthConfig } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export default {
	providers: [GitHubProvider],
} satisfies NextAuthConfig;
