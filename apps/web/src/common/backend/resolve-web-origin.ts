/** Preview SSR must use the requesting Web deployment, never localhost or Production. */
export function resolveWebOrigin(settings: {
	betterAuthUrl?: string;
	headers: Pick<Headers, "get">;
	vercel?: string;
	vercelEnv?: string;
}): string {
	if (settings.vercel === "1" && settings.vercelEnv === "preview") {
		const host =
			settings.headers.get("x-forwarded-host") ?? settings.headers.get("host");
		if (
			!host ||
			!/^(?:s-private|memdex-web)-[a-z0-9-]+-s-hirano-ist-team\.vercel\.app$/u.test(
				host,
			)
		) {
			throw new Error("Untrusted Preview Web host");
		}
		return `https://${host}`;
	}
	if (!settings.betterAuthUrl)
		throw new Error("BETTER_AUTH_URL is required outside Preview");
	return new URL(settings.betterAuthUrl).origin;
}
