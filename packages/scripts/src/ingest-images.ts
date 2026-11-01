#!/usr/bin/env node
import type { PreparedImport } from "@s-hirano-ist/s-application/batch/import-models";
import { sharpImageProcessor } from "@s-hirano-ist/s-infrastructure/content/sharp-image-processor";
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { globPaths } from "./lib/glob-paths.js";
import { runContentImport } from "./lib/run-content-import.js";

async function* source(root: string): AsyncGenerator<PreparedImport> {
	for (const path of await globPaths(`${root}/image/dump/*`)) {
		const format = /\.(jpg|jpeg|png|webp)$/iu.exec(path)?.[1]?.toLowerCase();
		if (!format) continue;
		const bytes = await readFile(path);
		const metadata = await sharpImageProcessor.getMetadata(bytes);
		yield {
			values: {
				path: basename(path),
				fileSize: (await stat(path)).size,
				contentType: `image/${format === "jpg" ? "jpeg" : format}`,
				width: metadata.width ?? null,
				height: metadata.height ?? null,
			},
			media: { path: basename(path), bytes },
		};
	}
}
await runContentImport("images", source);
