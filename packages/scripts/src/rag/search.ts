#!/usr/bin/env node
import "dotenv/config";
import type { SearchResult } from "@s-hirano-ist/s-search/config";
import { embed } from "@s-hirano-ist/s-search/embedding";
import {
	ensureCollection,
	search as qdrantSearch,
} from "@s-hirano-ist/s-search/qdrant-client";

type SearchOptions = {
	topK?: number;
	type?: "markdown_note" | "bookmark_json";
	heading?: string;
};

function parseArgs(): { query: string; options: SearchOptions } {
	const args = process.argv.slice(2);
	const options: SearchOptions = {};
	const positional: string[] = [];

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--top-k" && i + 1 < args.length) {
			options.topK = Number(args[++i]);
		} else if (arg === "--type" && i + 1 < args.length) {
			options.type = args[++i] as SearchOptions["type"];
		} else if (arg === "--heading" && i + 1 < args.length) {
			options.heading = args[++i];
		} else {
			positional.push(arg);
		}
	}

	const query = positional.join(" ");
	if (!query) {
		console.error(
			"Usage: rag-search <query> [--top-k N] [--type markdown_note|bookmark_json] [--heading HEADING]",
		);
		process.exit(1);
	}

	return { query, options };
}

async function searchContent(
	query: string,
	options: SearchOptions = {},
): Promise<{ results: SearchResult[]; query: string; totalResults: number }> {
	const queryVector = await embed(query, true);
	const results = await qdrantSearch(queryVector, {
		topK: options.topK,
		filter: { type: options.type, top_heading: options.heading },
	});
	return { results, query, totalResults: results.length };
}

async function search(): Promise<void> {
	const { query, options } = parseArgs();

	console.log(`Searching for: "${query}"`);
	if (options.topK) console.log(`  top-k: ${options.topK}`);
	if (options.type) console.log(`  type: ${options.type}`);
	if (options.heading) console.log(`  heading: ${options.heading}`);
	console.log();

	await ensureCollection();

	const response = await searchContent(query, options);

	console.log(`Found ${response.totalResults} results:\n`);

	for (const [i, result] of response.results.entries()) {
		console.log(`--- Result ${i + 1} (score: ${result.score.toFixed(4)}) ---`);
		console.log(`Title: ${result.title}`);
		if (result.url) console.log(`URL: ${result.url}`);
		console.log(`Type: ${result.type}`);
		console.log(`Heading: ${result.heading_path.join(" > ")}`);
		console.log(`\n${result.text}\n`);
	}
}

async function main() {
	const env = {
		QDRANT_URL: process.env.QDRANT_URL,
	} as const;

	if (!env.QDRANT_URL) {
		throw new Error("QDRANT_URL environment variable is required.");
	}

	try {
		await search();
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
