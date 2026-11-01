#!/usr/bin/env node
import type { PreparedImport } from "@s-hirano-ist/s-application/batch/import-models";
import { makeISBN } from "@s-hirano-ist/s-core/books/entities/book-entity";
import { parseMarkdownFrontmatter } from "@s-hirano-ist/s-search/frontmatter";
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { globPaths } from "./lib/glob-paths.js";
import { runContentImport } from "./lib/run-content-import.js";

type BookFrontmatter = {
	googleAuthors?: string[];
	googleDescription?: string | null;
	googleHref?: string | null;
	googleImgSrc?: string | null;
	googleSubtitle?: string | null;
	heading?: string | number;
	rating?: number;
	tags?: string[];
	title?: string;
};

type ParsedBook = {
	googleAuthors: string[];
	googleDescription: string | null;
	googleHref: string | null;
	googleImgSrc: string | null;
	googleSubTitle: string | null;
	markdown: string | null;
	rating: number;
	tags: string[];
	title: string;
};

function parseBookFile(content: string): ParsedBook {
	const parsed = parseMarkdownFrontmatter<BookFrontmatter>(content);
	const data = parsed.data;

	// title: frontmatter.title を優先、無ければ本文の H1 からフォールバック
	let title = data.title?.trim() ?? "";
	if (!title) {
		const h1Match = /^# (.+)$/mu.exec(parsed.content);
		title = h1Match ? h1Match[1].trim() : "";
	}

	const body = parsed.content.trim();

	// oxlint-disable-next-line typescript/no-unnecessary-condition -- frontmatter is untrusted YAML; rating can be null at runtime despite the declared type
	if (data.rating === undefined || data.rating === null) {
		throw new Error(
			"rating は必須です (frontmatter に rating フィールドがありません)",
		);
	}

	return {
		title,
		markdown: body || null,
		rating: data.rating,
		tags: data.tags ?? [],
		googleSubTitle: data.googleSubtitle ?? null,
		googleAuthors: data.googleAuthors ?? [],
		googleDescription: data.googleDescription ?? null,
		googleImgSrc: data.googleImgSrc ?? null,
		googleHref: data.googleHref ?? null,
	};
}

async function* source(root: string): AsyncGenerator<PreparedImport> {
	const covers = new Map<string, string>();
	for (const path of await globPaths(`${root}/image/book/*`)) {
		if (!/\.(?:jpg|jpeg|png|webp)$/iu.test(path)) continue;
		covers.set(makeISBN(basename(path, extname(path))), path);
	}
	for (const path of await globPaths(`${root}/markdown/book/*.md`)) {
		const isbn = makeISBN(basename(path, ".md"));
		const cover = covers.get(isbn);
		yield {
			values: {
				...parseBookFile(await readFile(path, "utf-8")),
				isbn,
				imagePath: cover ? basename(cover) : null,
			},
			preserveImagePath: !cover,
			...(cover
				? { media: { path: basename(cover), bytes: await readFile(cover) } }
				: {}),
		};
	}
}
await runContentImport("books", source);
