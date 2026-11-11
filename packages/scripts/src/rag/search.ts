#!/usr/bin/env node
import { runCli } from "../lib/cli-observability.js";

await runCli("rag-search", async () => {
	const { main } = await import("./search-command.js");
	await main();
});
