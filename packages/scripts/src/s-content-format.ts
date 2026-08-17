#!/usr/bin/env node
import { runContentFormat } from "./s-content-format-runner.ts";

async function main(): Promise<void> {
	try {
		const { code, signal } = await runContentFormat(process.argv.slice(2));
		if (signal !== null) {
			process.kill(process.pid, signal);
			return;
		}
		process.exitCode = code ?? 1;
	} catch (error) {
		console.error(error);
		process.exitCode = 1;
	}
}

void main();
