#!/usr/bin/env node
import type { PreparedImport } from "@s-hirano-ist/s-application/batch/import-models";
import { readFile } from "node:fs/promises";
import { globPaths } from "./lib/glob-paths.js";
import { runContentImport } from "./lib/run-content-import.js";

type ArticleJson = {
	body: {
		ogDescription?: string;
		ogImageUrl?: string;
		ogTitle?: string;
		quote?: string;
		title: string;
		url: string;
	}[];
	heading: string;
};

async function* source(root: string): AsyncGenerator<PreparedImport> {
	for (const path of await globPaths(`${root}/json/article/*.json`)) {
		const json = JSON.parse(await readFile(path, "utf-8")) as ArticleJson;
		for (const item of json.body)
			yield {
				values: {
					...item,
					categoryName: json.heading,
					quote: item.quote ?? null,
					ogTitle: item.ogTitle ?? null,
					ogDescription: item.ogDescription ?? null,
					ogImageUrl: item.ogImageUrl ?? null,
				},
			};
	}
}
await runContentImport("articles", source);
