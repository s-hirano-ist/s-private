#!/usr/bin/env node
import type { PreparedImport } from "@s-hirano-ist/s-application/batch/import-models";
import { parseMarkdownFrontmatter } from "@s-hirano-ist/s-search/frontmatter";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { globPaths } from "./lib/glob-paths.js";
import { runContentImport } from "./lib/run-content-import.js";

function parseFrontmatter(content: string): {
	body: string;
	draft?: boolean;
	heading?: string;
} {
	const parsed = parseMarkdownFrontmatter(content);
	return {
		body: parsed.content.trim(),
		draft:
			typeof parsed.data.draft === "boolean" ? parsed.data.draft : undefined,
		heading:
			typeof parsed.data.heading === "string" ? parsed.data.heading : undefined,
	};
}

function parseNoteFile(
	filePath: string,
	content: string,
): { markdown: string; title: string } | null {
	const { heading, draft, body } = parseFrontmatter(content);

	if (draft) return null;

	if (heading) {
		return { title: heading, markdown: body };
	}

	const title = basename(filePath, ".md");
	const titleLine = `# ${title}`;
	let markdown = body;
	if (markdown.startsWith(titleLine)) {
		markdown = markdown.slice(titleLine.length).replace(/^\n+/u, "");
	}
	return { title, markdown };
}

async function* source(root: string): AsyncGenerator<PreparedImport> {
	for (const path of await globPaths(`${root}/markdown/note/*.md`)) {
		const values = parseNoteFile(path, await readFile(path, "utf-8"));
		if (values) yield { values };
	}
}
await runContentImport("notes", source);
