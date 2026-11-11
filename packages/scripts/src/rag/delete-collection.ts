#!/usr/bin/env node
import { runCli } from "../lib/cli-observability.js";

await runCli("rag-delete-collection", async () => {
	const { main } = await import("./delete-collection-command.js");
	await main();
});
