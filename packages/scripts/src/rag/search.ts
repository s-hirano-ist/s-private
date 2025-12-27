import { embed } from "./embedding";
import { getCollectionStats, search } from "./qdrant-client";

/**
 * Search for documents matching a query
 */
async function runSearch(): Promise<void> {
	// Parse command line arguments
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log("Usage: bun script/rag/search.ts <query> [options]");
		console.log("");
		console.log("Options:");
		console.log("  --top-k <number>     Number of results (default: 5)");
		console.log(
			"  --type <type>        Filter by type: markdown_note | bookmark_json",
		);
		console.log("  --heading <heading>  Filter by top_heading");
		console.log("");
		console.log("Examples:");
		console.log('  bun script/rag/search.ts "ルネサンス 遠近法"');
		console.log('  bun script/rag/search.ts "AI 脆弱性" --type bookmark_json');
		console.log(
			'  bun script/rag/search.ts "React" --heading javascript --top-k 10',
		);
		process.exit(1);
	}

	// Parse options
	let query = "";
	let topK = 5;
	let filterType: "markdown_note" | "bookmark_json" | undefined;
	let filterHeading: string | undefined;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--top-k" && args[i + 1]) {
			topK = Number.parseInt(args[i + 1], 10);
			i++;
		} else if (args[i] === "--type" && args[i + 1]) {
			filterType = args[i + 1] as "markdown_note" | "bookmark_json";
			i++;
		} else if (args[i] === "--heading" && args[i + 1]) {
			filterHeading = args[i + 1];
			i++;
		} else if (!args[i].startsWith("--")) {
			query = args[i];
		}
	}

	if (!query) {
		console.error("Error: Query is required");
		process.exit(1);
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

// Run search
runSearch().catch(console.error);
