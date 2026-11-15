import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

const start = "# BEGIN generated MCP — pnpm harness:sync";
const end = "# END generated MCP";

function validateServer(name, server) {
	if (!/^[a-z0-9-]+$/u.test(name)) {
		throw new Error(`Invalid MCP server name: ${name}`);
	}
	if (Boolean(server.url) === Boolean(server.command)) {
		throw new Error(`MCP ${name} must have either url or command.`);
	}
	if (
		server.command &&
		!server.args?.some((arg) => /@\d+\.\d+\.\d+(?:-[\w.]+)?$/u.test(arg))
	) {
		throw new Error(`MCP ${name} must pin its package version.`);
	}
}

function renderClaude(server) {
	const config = server.url
		? { type: "http", url: server.url }
		: { command: server.command, args: server.args };
	if (server.tokenEnv) {
		config.headers = { Authorization: `Bearer \${${server.tokenEnv}}` };
	}
	if (server.env) config.env = server.env;
	return config;
}

function renderTomlValue(value) {
	return Array.isArray(value)
		? `[${value.map((item) => JSON.stringify(item)).join(", ")}]`
		: JSON.stringify(value);
}

function renderCodex(name, server) {
	const lines = ["", `[mcp_servers.${name}]`];
	const values = server.url
		? {
				url: server.url,
				...(server.tokenEnv ? { bearer_token_env_var: server.tokenEnv } : {}),
			}
		: {
				command: server.command,
				args: server.args,
				...(server.envVars ? { env_vars: server.envVars } : {}),
			};
	for (const [key, value] of Object.entries(values)) {
		lines.push(`${key} = ${renderTomlValue(value)}`);
	}
	if (server.env) {
		lines.push("", `[mcp_servers.${name}.env]`);
		for (const [key, value] of Object.entries(server.env)) {
			lines.push(`${key} = ${JSON.stringify(value)}`);
		}
	}
	return lines;
}

/** Render client adapters without reading or expanding credentials. */
export function renderMcp(servers) {
	const claude = {};
	const toml = [start];
	for (const [name, server] of Object.entries(servers)) {
		validateServer(name, server);
		if (!server.clients || server.clients.includes("claude")) {
			claude[name] = renderClaude(server);
		}
		if (!server.clients || server.clients.includes("codex")) {
			toml.push(...renderCodex(name, server));
		}
	}
	toml.push("", end, "");
	return {
		claude: `${JSON.stringify({ mcpServers: claude }, null, "\t")}\n`,
		codex: toml.join("\n"),
	};
}

/** Preserve all non-MCP Codex configuration, including plugins and hooks. */
export function replaceCodexMcp(existing, generated) {
	const begin = existing.indexOf(start);
	const finish = existing.indexOf(end);
	if ((begin === -1) !== (finish === -1) || (begin !== -1 && finish < begin)) {
		throw new Error("Invalid generated MCP markers in .codex/config.toml.");
	}
	const before = begin === -1 ? existing : existing.slice(0, begin);
	const after =
		finish === -1
			? ""
			: existing.slice(finish + end.length).replace(/^\r?\n/u, "");
	if (
		(before + after).split(/\r?\n/u).some((line) => {
			const trimmed = line.trimStart();
			return (
				trimmed.startsWith("[mcp_servers.") ||
				trimmed.startsWith("[mcp_servers]")
			);
		})
	) {
		throw new Error(
			"Move unmanaged project MCP entries to .harness/mcp.json before syncing.",
		);
	}
	return `${before.trimEnd()}\n\n${generated}${after}`;
}

export function manageMcp(repoRoot, mode) {
	const source = JSON.parse(
		fs.readFileSync(path.join(repoRoot, ".harness/mcp.json"), "utf8"),
	);
	const rendered = renderMcp(source.servers);
	const codexPath = path.join(repoRoot, ".codex/config.toml");
	const existing = fs.readFileSync(codexPath, "utf8");
	const outputs = [
		[codexPath, replaceCodexMcp(existing, rendered.codex)],
		[path.join(repoRoot, ".mcp.json"), rendered.claude],
	];
	const errors = [];
	for (const [file, expected] of outputs) {
		const actual = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
		let matches = actual === expected;
		if (file.endsWith(".json") && actual) {
			try {
				matches = isDeepStrictEqual(JSON.parse(actual), JSON.parse(expected));
			} catch {
				matches = false;
			}
		}
		if (matches) continue;
		if (mode === "sync") fs.writeFileSync(file, expected);
		else
			errors.push(
				`MCP configuration differs: ${path.relative(repoRoot, file)}. Run pnpm harness:sync.`,
			);
	}
	return errors;
}
