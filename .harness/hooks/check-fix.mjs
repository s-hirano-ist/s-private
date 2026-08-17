#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const inputText = await readStandardInput();

let input;
try {
	input = JSON.parse(inputText);
} catch {
	writeResult({
		continue: false,
		stopReason: "Harness hook received invalid JSON input.",
	});
	process.exit(0);
}

// oxlint-disable-next-line sonarjs/no-os-command-from-path -- pnpm is supplied by the trusted developer environment.
const result = spawnSync("pnpm", ["check:fix"], {
	cwd: repoRoot,
	encoding: "utf8",
	env: process.env,
	stdio: ["ignore", "pipe", "pipe"],
});

if (result.status === 0 && result.error === undefined) {
	writeResult({});
	process.exit(0);
}

const details = formatFailure(result);
const reason = `pnpm check:fix failed. Fix the remaining errors before finishing.\n\n${details}`;

if (input.stop_hook_active === true) {
	writeResult({
		continue: false,
		stopReason: reason,
	});
} else {
	writeResult({
		decision: "block",
		reason,
	});
}

function formatFailure(commandResult) {
	const output = [
		commandResult.stdout,
		commandResult.stderr,
		commandResult.error?.message,
	]
		.filter(Boolean)
		.join("\n")
		.trim();
	const fallback = `pnpm exited with status ${commandResult.status ?? "unknown"}.`;
	const maximumLength = 6000;
	const diagnostics = output || fallback;

	return diagnostics.length <= maximumLength
		? diagnostics
		: `…${diagnostics.slice(-maximumLength)}`;
}

async function readStandardInput() {
	const chunks = [];

	for await (const chunk of process.stdin) {
		chunks.push(chunk);
	}

	return Buffer.concat(chunks).toString("utf8");
}

function writeResult(value) {
	process.stdout.write(`${JSON.stringify(value)}\n`);
}
