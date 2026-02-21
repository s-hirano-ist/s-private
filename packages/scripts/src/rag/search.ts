#!/usr/bin/env node
import "dotenv/config";
import type { ContentType, SearchResult } from "@s-hirano-ist/s-search/config";
import { createEmbeddingClient } from "@s-hirano-ist/s-search/embedding-client";
import {
	ensureCollection,
	search as qdrantSearch,
} from "@s-hirano-ist/s-search/qdrant-client";

type SearchOptions = {
	topK?: number;
	type?: "markdown_note" | "bookmark_json";
	heading?: string;
	contentType?: ContentType | ContentType[];
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
		} else if (arg === "--content-type" && i + 1 < args.length) {
			const value = args[++i];
			const types = value.split(",") as ContentType[];
			options.contentType = types.length === 1 ? types[0] : types;
		} else {
			positional.push(arg);
		}
	}

	const query = positional.join(" ");
	if (!query) {
		console.error(
			"Usage: rag-search <query> [--top-k N] [--type markdown_note|bookmark_json] [--heading HEADING] [--content-type articles|books|notes]",
		);
		process.exit(1);
	}

	return { query, options };
}

const embeddingClient = createEmbeddingClient({
	apiUrl: process.env.EMBEDDING_API_URL ?? "",
	cfAccessClientId: process.env.CF_ACCESS_CLIENT_ID ?? "",
	cfAccessClientSecret: process.env.CF_ACCESS_CLIENT_SECRET ?? "",
});

async function searchContent(
	query: string,
	options: SearchOptions = {},
): Promise<{ results: SearchResult[]; query: string; totalResults: number }> {
	const queryVector = await embeddingClient.embed(query, true);
	const results = await qdrantSearch(queryVector, {
		topK: options.topK,
		filter: {
			type: options.type,
			top_heading: options.heading,
			content_type: options.contentType,
		},
	});
	return { results, query, totalResults: results.length };
}

async function search(): Promise<void> {
	const { query, options } = parseArgs();

	console.log(`Searching for: "${query}"`);
	if (options.topK) console.log(`  top-k: ${options.topK}`);
	if (options.type) console.log(`  type: ${options.type}`);
	if (options.heading) console.log(`  heading: ${options.heading}`);
	if (options.contentType)
		console.log(
			`  content-type: ${Array.isArray(options.contentType) ? options.contentType.join(",") : options.contentType}`,
		);
	console.log();

	await ensureCollection();

	const response = await searchContent(query, options);

	console.log(`Found ${response.totalResults} results:\n`);

	for (const [i, result] of response.results.entries()) {
		console.log(`--- Result ${i + 1} (score: ${result.score.toFixed(4)}) ---`);
		console.log(`Title: ${result.title}`);
		if (result.url) console.log(`URL: ${result.url}`);
		console.log(`Type: ${result.type}`);
		console.log(`Content-Type: ${result.content_type}`);
		console.log(`Heading: ${result.heading_path.join(" > ")}`);
		console.log(`\n${result.text}\n`);
	}
}

async function main() {
	const env = {
		QDRANT_URL: process.env.QDRANT_URL,
		EMBEDDING_API_URL: process.env.EMBEDDING_API_URL,
	} as const;

	if (!env.QDRANT_URL) {
		throw new Error("QDRANT_URL environment variable is required.");
	}
	if (!env.EMBEDDING_API_URL) {
		throw new Error("EMBEDDING_API_URL environment variable is required.");
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
