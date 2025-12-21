import { embed } from "./embedding.js";
import { getCollectionStats, search } from "./qdrant-client.js";

export type SearchOptions = {
	query: string;
	topK?: number;
	type?: "markdown_note" | "bookmark_json";
	heading?: string;
};

/**
 * Search for documents matching a query
 */
export async function runSearch(options: SearchOptions): Promise<void> {
	const { query, topK = 5, type: filterType, heading: filterHeading } = options;

	if (!query) {
		console.error("Error: Query is required");
		throw new Error("Query is required");
	}

	// Check collection status
	const stats = await getCollectionStats();
	if (stats.status === "not_found") {
		console.error("Error: Collection not found. Run ingest first.");
		process.exit(1);
	}

	console.log(`Searching for: "${query}"`);
	console.log(`Collection has ${stats.pointsCount} points\n`);

	// Generate query embedding
	console.log("Generating query embedding...");
	const queryVector = await embed(query, true);

	// Search
	console.log("Searching...\n");
	const results = await search(queryVector, {
		topK,
		filter: {
			type: filterType,
			top_heading: filterHeading,
		},
	});

	// Display results
	console.log(`Found ${results.length} results:\n`);
	console.log("=".repeat(80));

	for (let i = 0; i < results.length; i++) {
		const r = results[i];
		console.log(`\n[${i + 1}] Score: ${r.score.toFixed(4)}`);
		console.log(`    Title: ${r.title}`);
		console.log(`    Type: ${r.type}`);
		console.log(`    Path: ${r.heading_path.join(" > ")}`);
		if (r.url) {
			console.log(`    URL: ${r.url}`);
		}
		console.log(
			`    Text: ${r.text.slice(0, 200)}${r.text.length > 200 ? "..." : ""}`,
		);
		console.log("-".repeat(80));
	}
}
