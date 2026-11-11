#!/usr/bin/env node
import { runCli } from "../lib/cli-observability.js";

await runCli("rag-ingest", async () => {
	const { main } = await import("./ingest-command.js");
	await main();
});
