import { z } from "zod";

const csv = z
	.string()
	.optional()
	.transform(
		(value) =>
			value
				?.split(",")
				.map((item) => item.trim())
				.filter(Boolean) ?? [],
	);

export const mcpEnvSchema = z.object({
	MCP_RESOURCE_URL: z.url().optional(),
	MCP_ALLOWED_CLIENT_IDS: csv,
	MCP_ALLOWED_ORIGINS: csv,
});

export type McpConfig = {
	clientIds: string[];
	issuer: string;
	origins: string[];
	resource: URL;
};

function secureUrl(url: URL, local: boolean) {
	return (
		url.protocol === "https:" ||
		(local &&
			url.protocol === "http:" &&
			["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
	);
}

export function resolveMcpConfig(
	env: z.output<typeof mcpEnvSchema> & {
		AUTH0_ISSUER_BASE_URL?: string;
		MOBILE_API_AUDIENCE?: string;
		NODE_ENV: string;
		VERCEL?: string;
	},
): McpConfig | undefined {
	if (!env.MCP_RESOURCE_URL) return undefined;
	const resource = new URL(env.MCP_RESOURCE_URL);
	const local = env.NODE_ENV !== "production" && env.VERCEL !== "1";
	if (
		resource.pathname !== "/mcp" ||
		resource.search ||
		resource.hash ||
		resource.username ||
		resource.password ||
		!secureUrl(resource, local)
	)
		throw new Error(
			"MCP_RESOURCE_URL must be an HTTPS /mcp URL (loopback HTTP allowed locally)",
		);
	if (
		!env.AUTH0_ISSUER_BASE_URL ||
		new URL(env.AUTH0_ISSUER_BASE_URL).protocol !== "https:"
	)
		throw new Error("MCP requires an HTTPS Auth0 issuer");
	if (env.MCP_ALLOWED_CLIENT_IDS.length === 0)
		throw new Error("MCP_ALLOWED_CLIENT_IDS is required");
	if (
		env.MOBILE_API_AUDIENCE?.replace(/\/$/u, "") ===
		resource.href.replace(/\/$/u, "")
	)
		throw new Error("MCP and mobile audiences must differ");
	for (const origin of env.MCP_ALLOWED_ORIGINS) {
		const url = new URL(origin);
		if (url.origin !== origin || !secureUrl(url, local))
			throw new Error(
				"MCP_ALLOWED_ORIGINS must contain exact HTTPS origins (loopback HTTP allowed locally)",
			);
	}
	return {
		resource,
		issuer: env.AUTH0_ISSUER_BASE_URL.endsWith("/")
			? env.AUTH0_ISSUER_BASE_URL
			: `${env.AUTH0_ISSUER_BASE_URL}/`,
		clientIds: env.MCP_ALLOWED_CLIENT_IDS,
		origins: [resource.origin, ...env.MCP_ALLOWED_ORIGINS],
	};
}
