export const vercelPreviewHosts = [
	"s-private-*-s-hirano-ist-team.vercel.app",
	"memdex-web-*-s-hirano-ist-team.vercel.app",
] as const;

/** Match only this Web project's deployment aliases in the existing Vercel team. */
export function isTrustedWebOrigin(
	origin: string,
	config: { BETTER_AUTH_URL?: string; VERCEL?: string },
): boolean {
	if (
		config.BETTER_AUTH_URL &&
		origin === new URL(config.BETTER_AUTH_URL).origin
	)
		return true;
	if (config.VERCEL !== "1") return false;
	try {
		const url = new URL(origin);
		return (
			url.origin === origin &&
			url.protocol === "https:" &&
			url.port === "" &&
			/^(?:s-private|memdex-web)-[a-z0-9-]+-s-hirano-ist-team\.vercel\.app$/u.test(
				url.hostname,
			)
		);
	} catch {
		return false;
	}
}
