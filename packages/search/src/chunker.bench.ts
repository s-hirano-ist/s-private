import { bench, describe } from "vitest";
import {
	parseDbArticle,
	parseDbNote,
	parseJsonArticle,
	parseMarkdown,
} from "./chunker.ts";

// ---------------------------------------------------------------------------
// Test data generators
// ---------------------------------------------------------------------------

function generateMarkdownSmall(): string {
	return `---
heading: Small Document
description: A brief note
---

## Introduction

This is a small markdown document with a single heading and a short paragraph.
It contains roughly 500 characters of content to simulate a minimal note.

Some bullet points:
- Item one with a brief description of the topic
- Item two with another explanation
- Item three that wraps up the list

Final thoughts on this small document that serve as a conclusion paragraph.
`;
}

function generateMarkdownMedium(): string {
	const sections: string[] = [
		`---
heading: Medium Document
description: A moderately sized article
---
`,
	];

	for (let i = 1; i <= 5; i++) {
		sections.push(`## Section ${i}\n`);
		for (let j = 0; j < 3; j++) {
			sections.push(`Paragraph ${j + 1} of section ${i}. `.repeat(8) + "\n");
		}
	}

	return sections.join("\n");
}

function generateMarkdownLarge(): string {
	const sections: string[] = [
		`---
heading: Large Document
description: A comprehensive technical article
---
`,
	];

	for (let i = 1; i <= 20; i++) {
		sections.push(`## Chapter ${i}\n`);
		if (i % 3 === 0) {
			sections.push(`### Subsection ${i}.1\n`);
		}
		// Each paragraph ~200 chars, 6 paragraphs per section → ~1200 chars/section
		// 20 sections → ~24KB body, well above maxChunkLength (2000) to trigger splitting
		for (let j = 0; j < 6; j++) {
			sections.push(
				`This is paragraph ${j + 1} of chapter ${i} covering detailed technical content. `.repeat(
					5,
				) + "\n",
			);
		}
	}

	return sections.join("\n");
}

function generateJsonSmall(): string {
	return JSON.stringify({
		heading: "Small Bookmarks",
		description: "A few links",
		body: Array.from({ length: 5 }, (_, i) => ({
			title: `Article ${i + 1}`,
			url: `https://example.com/article-${i + 1}`,
			ogTitle: `OG Title ${i + 1}`,
			ogDescription: `A brief description of article ${i + 1}.`,
		})),
	});
}

function generateJsonLarge(): string {
	return JSON.stringify({
		heading: "Large Bookmarks Collection",
		description: "An extensive collection",
		body: Array.from({ length: 200 }, (_, i) => ({
			title: `Article ${i + 1}: ${"Topic ".repeat(5)}`,
			url: `https://example.com/articles/${i + 1}`,
			ogTitle: `Open Graph Title for Article ${i + 1}`,
			ogDescription: `Detailed description for article ${i + 1}. `.repeat(3),
			quote: i % 3 === 0 ? `Notable quote from article ${i + 1}.` : undefined,
		})),
	});
}

// ---------------------------------------------------------------------------
// Pre-generate test data (outside benchmark loops)
// ---------------------------------------------------------------------------

const mdSmall = generateMarkdownSmall();
const mdMedium = generateMarkdownMedium();
const mdLarge = generateMarkdownLarge();
const jsonSmall = generateJsonSmall();
const jsonLarge = generateJsonLarge();

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

describe("parseMarkdown", () => {
	bench("small (~500 chars)", () => {
		parseMarkdown("test/small.md", mdSmall);
	});

	bench("medium (~5KB)", () => {
		parseMarkdown("test/medium.md", mdMedium);
	});

	bench("large (~50KB, chunk splitting)", () => {
		parseMarkdown("test/large.md", mdLarge);
	});
});

describe("parseJsonArticle", () => {
	bench("small (5 items)", () => {
		parseJsonArticle("test/small.json", jsonSmall);
	});

	bench("large (200 items)", () => {
		parseJsonArticle("test/large.json", jsonLarge);
	});
});

describe("parseDbNote", () => {
	bench("short note", () => {
		parseDbNote("note-1", "Quick Note", "A brief note with minimal content.");
	});

	bench("long note", () => {
		const longBody = Array.from(
			{ length: 20 },
			(_, i) =>
				`## Section ${i + 1}\n\n${"Detailed content for this section. ".repeat(10)}`,
		).join("\n\n");
		parseDbNote("note-2", "Comprehensive Note", longBody);
	});
});

describe("parseDbArticle", () => {
	bench("minimal fields", () => {
		parseDbArticle({
			id: "art-1",
			title: "Sample Article",
			url: "https://example.com/1",
			categoryName: "Tech",
		});
	});

	bench("all fields populated", () => {
		parseDbArticle({
			id: "art-2",
			title: "Full Article",
			url: "https://example.com/2",
			ogTitle: "OG Title for Full Article",
			ogDescription:
				"A comprehensive open graph description that provides context.",
			quote: "An insightful quote from the article that captures the key idea.",
			categoryName: "Engineering",
		});
	});
});
