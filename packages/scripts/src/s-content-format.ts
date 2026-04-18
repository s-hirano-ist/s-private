#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const dprintPkgPath = require.resolve("dprint/package.json");
const dprintBin = path.join(path.dirname(dprintPkgPath), "bin.cjs");

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const configPath = path.join(packageRoot, "configs", "dprint.json");

const DEFAULT_EXCLUDES = [
	"!**/node_modules",
	"!**/dist",
	"!**/build",
	"!**/coverage",
	"!**/raw/article/**",
	"!**/bun.lock",
	"!**/package-lock.json",
	"!**/yarn.lock",
	"!**/.env",
	"!**/.env.*",
];

const rawArgs = process.argv.slice(2);
const checkFlagIndex = rawArgs.indexOf("--check");
const isCheck = checkFlagIndex !== -1;
const remaining =
	checkFlagIndex === -1
		? rawArgs
		: [
				...rawArgs.slice(0, checkFlagIndex),
				...rawArgs.slice(checkFlagIndex + 1),
			];
const subcommand = isCheck ? "check" : "fmt";

const hasPositional = remaining.some((arg) => !arg.startsWith("-"));
const finalArgs = hasPositional
	? remaining
	: [...remaining, ".", ...DEFAULT_EXCLUDES];

const child = spawn(
	process.execPath,
	[dprintBin, subcommand, "--config", configPath, ...finalArgs],
	{ stdio: "inherit" },
);

child.on("exit", (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}
	process.exit(code ?? 1);
});
