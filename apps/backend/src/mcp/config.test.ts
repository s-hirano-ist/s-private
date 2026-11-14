import { parseBackendEnv } from "s-private-backend/env";
import { mcpEnvSchema, resolveMcpConfig } from "s-private-backend/mcp/config";
import { expect, test } from "vite-plus/test";

const base = {
	NODE_ENV: "development",
	AUTH0_ISSUER_BASE_URL: "https://auth.example.test/",
	MOBILE_API_AUDIENCE: "mobile-api",
};
function parse(input: Record<string, string | undefined>) {
	return resolveMcpConfig({ ...base, ...input, ...mcpEnvSchema.parse(input) });
}
const enabled = {
	MCP_RESOURCE_URL: "https://api.example.test/mcp",
	MCP_ALLOWED_CLIENT_IDS: "client-a, client-b",
};
test("MCP is opt-in and parses exact client and origin allowlists", () => {
	expect(parse({})).toBeUndefined();
	expect(
		parse({
			...enabled,
			MCP_ALLOWED_ORIGINS: "https://inspector.example.test",
		}),
	).toMatchObject({
		clientIds: ["client-a", "client-b"],
		origins: ["https://api.example.test", "https://inspector.example.test"],
	});
	expect(
		parse({ ...enabled, MCP_RESOURCE_URL: "http://localhost:3002/mcp" })
			?.resource.protocol,
	).toBe("http:");
});
test.each([
	{ MCP_ALLOWED_CLIENT_IDS: undefined },
	{ MCP_ALLOWED_CLIENT_IDS: ", ," },
	{ AUTH0_ISSUER_BASE_URL: undefined },
	{ AUTH0_ISSUER_BASE_URL: "http://auth.example.test/" },
	{ MCP_RESOURCE_URL: "https://api.example.test/mcp/" },
	{ MCP_RESOURCE_URL: "https://api.example.test/other" },
	{ MCP_RESOURCE_URL: "https://api.example.test/mcp?secret=x" },
	{ MCP_RESOURCE_URL: "https://api.example.test/mcp#fragment" },
	{ MCP_RESOURCE_URL: "https://user:password@api.example.test/mcp" },
	{ MCP_RESOURCE_URL: "http://api.example.test/mcp" },
	{ MCP_RESOURCE_URL: "http://localhost:3002/mcp", VERCEL: "1" },
	{ MCP_RESOURCE_URL: "http://localhost:3002/mcp", NODE_ENV: "production" },
	{ MOBILE_API_AUDIENCE: enabled.MCP_RESOURCE_URL },
	{ MOBILE_API_AUDIENCE: `${enabled.MCP_RESOURCE_URL}/` },
	{ MCP_ALLOWED_ORIGINS: "https://example.test/path" },
	{ MCP_ALLOWED_ORIGINS: "https://example.test/" },
	{ MCP_ALLOWED_ORIGINS: "*" },
	{ MCP_ALLOWED_ORIGINS: "http://example.test" },
])("rejects unsafe MCP configuration: %j", (overrides) => {
	expect(() => parse({ ...enabled, ...overrides })).toThrow(/MCP|Invalid/u);
});
test("backend validates MCP settings at startup even with local Web authentication", () => {
	const input = {
		LOCAL_DEV_MODE: "true",
		DATABASE_URL: "postgresql://localhost/test",
		AUTH_SECRET: "secret".repeat(8),
		LOCAL_AUTH_EMAIL: "dev@example.test",
		LOCAL_AUTH_PASSWORD: "password",
		LOCAL_AUTH_NAME: "dev",
		S3_ENDPOINT: "http://localhost:9000",
		S3_REGION: "test",
		S3_BUCKET_NAME: "test",
		S3_ACCESS_KEY_ID: "test",
		S3_SECRET_ACCESS_KEY: "test",
		QDRANT_URL: "http://localhost:6333",
		QDRANT_COLLECTION_NAME: "test",
	};
	expect(parseBackendEnv(input).MCP_RESOURCE_URL).toBeUndefined();
	expect(() => parseBackendEnv({ ...input, ...enabled })).toThrow(
		"Auth0 issuer",
	);
});
