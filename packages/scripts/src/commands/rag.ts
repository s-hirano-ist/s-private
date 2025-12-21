import { defineCommand } from "citty";
import consola from "consola";
import { ingest } from "../rag/ingest.js";
import { runSearch } from "../rag/search.js";

const ingestCommand = defineCommand({
	meta: {
		name: "ingest",
		description: "Ingest documents into Qdrant vector store",
	},
	run: async () => {
		try {
			consola.start("Starting document ingestion...");
			await ingest();
			consola.success("Ingestion completed");
		} catch (error) {
			consola.error("Error during ingestion:", error);
			process.exit(1);
		}
	},
});

const searchCommand = defineCommand({
	meta: {
		name: "search",
		description: "Search documents in Qdrant",
	},
	args: {
		query: {
			type: "positional",
			description: "Search query",
			required: true,
		},
		topK: {
			type: "string",
			alias: "k",
			description: "Number of results (default: 5)",
		},
		type: {
			type: "string",
			alias: "t",
			description: "Filter by type (markdown_note | bookmark_json)",
		},
		heading: {
			type: "string",
			alias: "h",
			description: "Filter by top heading",
		},
	},
	run: async ({ args }) => {
		try {
			await runSearch({
				query: args.query,
				topK: args.topK ? Number.parseInt(args.topK, 10) : 5,
				type: args.type as "markdown_note" | "bookmark_json" | undefined,
				heading: args.heading,
			});
		} catch (error) {
			consola.error("Error during search:", error);
			process.exit(1);
		}
	},
});

export const ragCommand = defineCommand({
	meta: {
		name: "rag",
		description: "RAG operations for document search",
	},
	subCommands: {
		ingest: ingestCommand,
		search: searchCommand,
	},
});
