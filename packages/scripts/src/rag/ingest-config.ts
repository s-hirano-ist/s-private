export const INGEST_CONFIG = {
	paths: {
		markdown: ["markdown/note/**/*.md", "markdown/book/**/*.md"],
		json: "json/article/**/*.json",
	},
} as const;
