#!/usr/bin/env node
import { runCli } from "./lib/cli-observability.js";
import { runContentFormat } from "./s-content-format-runner.js";

async function main(): Promise<void> {
	const { code, signal } = await runContentFormat(process.argv.slice(2));
	if (signal !== null) {
		process.kill(process.pid, signal);
		return;
	}
	process.exitCode = code ?? 1;
}

await runCli("s-content-format", main);
