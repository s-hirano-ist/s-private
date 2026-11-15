import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
// oxlint-disable-next-line vitest/no-import-node-test -- Harness checks run with node --test independently of the application test runner.
import { test } from "node:test";
import { manageMcp, renderMcp, replaceCodexMcp } from "./harness-mcp.mjs";

test("adapters reference credentials without expanding them and honor client selection", () => {
	const output = renderMcp({
		github: { url: "https://example.com/mcp", tokenEnv: "GITHUB_MCP_TOKEN" },
		local: {
			command: "npx",
			args: ["-y", "example@1.2.3"],
			envVars: ["TOKEN"],
		},
		ios: { clients: ["claude"], command: "npx", args: ["-y", "example@1.2.3"] },
	});
	assert.equal(
		JSON.parse(output.claude).mcpServers.github.headers.Authorization,
		"Bearer ${GITHUB_MCP_TOKEN}",
	);
	assert.match(output.codex, /bearer_token_env_var = "GITHUB_MCP_TOKEN"/u);
	assert.match(output.codex, /env_vars = \["TOKEN"\]/u);
	assert.doesNotMatch(output.codex, /mcp_servers.ios/u);
	assert.ok(JSON.parse(output.claude).mcpServers.ios);
});

test("sync is idempotent, preserves unrelated configuration, and check detects drift", (context) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "harness-mcp-"));
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	fs.mkdirSync(path.join(root, ".harness"));
	fs.mkdirSync(path.join(root, ".codex"));
	fs.writeFileSync(
		path.join(root, ".harness/mcp.json"),
		JSON.stringify({
			servers: { sentry: { url: "https://mcp.sentry.dev/mcp" } },
		}),
	);
	const config = path.join(root, ".codex/config.toml");
	const original =
		'[features]\ngoals = true\n\n[plugins."example@repo"]\nenabled = true\n';
	fs.writeFileSync(config, original);
	assert.equal(manageMcp(root, "check").length, 2);
	manageMcp(root, "sync");
	const first = fs.readFileSync(config, "utf8");
	assert.ok(first.startsWith(original));
	manageMcp(root, "sync");
	assert.equal(fs.readFileSync(config, "utf8"), first);
	assert.deepEqual(manageMcp(root, "check"), []);
	fs.writeFileSync(
		config,
		first.replace("https://mcp.sentry.dev/mcp", "https://example.com"),
	);
	assert.equal(manageMcp(root, "check").length, 1);
});

test("refuses unpinned packages and unmanaged MCP tables instead of deleting them", () => {
	assert.throws(
		() => renderMcp({ local: { command: "npx", args: ["example@latest"] } }),
		/pin/u,
	);
	assert.throws(
		() =>
			replaceCodexMcp(
				'[mcp_servers.personal]\nurl = "https://example.com"\n',
				"",
			),
		/unmanaged/u,
	);
	assert.throws(
		() => replaceCodexMcp("# BEGIN generated MCP — pnpm harness:sync\n", ""),
		/markers/u,
	);
});
