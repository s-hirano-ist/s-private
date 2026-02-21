import { describe, expect, test } from "vitest";
import {
	parseDbArticle,
	parseDbNote,
	parseJsonArticle,
	parseMarkdown,
} from "./chunker.ts";

describe("parseJsonArticle", () => {
	test("parses JSON article with all fields", () => {
		const json = JSON.stringify({
			heading: "Tech",
			body: [
				{
					title: "Article 1",
					url: "https://example.com/1",
					ogTitle: "OG Title",
					ogDescription: "OG Description",
					quote: "A quote",
				},
			],
		});

		const chunks = parseJsonArticle("articles/tech.json", json);

		expect(chunks).toHaveLength(1);
		expect(chunks[0].type).toBe("bookmark_json");
		expect(chunks[0].content_type).toBe("articles");
		expect(chunks[0].top_heading).toBe("Tech");
		expect(chunks[0].doc_id).toBe("file:articles/tech.json");
		expect(chunks[0].title).toBe("Article 1");
		expect(chunks[0].url).toBe("https://example.com/1");
		expect(chunks[0].heading_path).toEqual(["Tech"]);
		expect(chunks[0].text).toBe("Article 1\nOG Title\nOG Description\nA quote");
		expect(chunks[0].content_hash).toBeDefined();
	});

	test("deduplicates ogTitle when it matches title", () => {
		const json = JSON.stringify({
			heading: "Tech",
			body: [
				{
					title: "Same Title",
					url: "https://example.com",
					ogTitle: "Same Title",
					ogDescription: "Description",
				},
			],
		});

		const chunks = parseJsonArticle("test.json", json);

		expect(chunks[0].text).toBe("Same Title\nDescription");
	});

	test("skips empty items", () => {
		const json = JSON.stringify({
			heading: "Tech",
			body: [
				{ title: "", url: "https://example.com" },
				{
					title: "Valid",
					url: "https://example.com/valid",
					ogDescription: "Desc",
				},
			],
		});

		const chunks = parseJsonArticle("test.json", json);

		expect(chunks).toHaveLength(1);
		expect(chunks[0].title).toBe("Valid");
	});

	test("falls back to ogTitle when title is empty", () => {
		const json = JSON.stringify({
			heading: "Tech",
			body: [
				{
					title: "",
					url: "https://example.com",
					ogTitle: "OG Fallback",
					ogDescription: "Desc",
				},
			],
		});

		const chunks = parseJsonArticle("test.json", json);

		expect(chunks[0].title).toBe("OG Fallback");
	});

	test("handles multiple body items with correct chunk_ids", () => {
		const json = JSON.stringify({
			heading: "News",
			body: [
				{ title: "Item 1", url: "https://example.com/1" },
				{ title: "Item 2", url: "https://example.com/2" },
				{ title: "Item 3", url: "https://example.com/3" },
			],
		});

		const chunks = parseJsonArticle("news.json", json);

		expect(chunks).toHaveLength(3);
		expect(chunks[0].chunk_id).toBe("file:news.json#0");
		expect(chunks[1].chunk_id).toBe("file:news.json#1");
		expect(chunks[2].chunk_id).toBe("file:news.json#2");
	});
});

describe("parseMarkdown", () => {
	test("parses markdown with frontmatter and headings", () => {
		const content = `---
heading: My Notes
description: Some notes
---

## Section 1

Content of section 1.

## Section 2

Content of section 2.
`;

		const chunks = parseMarkdown("notes/test.md", content);

		expect(chunks).toHaveLength(2);
		expect(chunks[0].type).toBe("markdown_note");
		expect(chunks[0].content_type).toBe("notes");
		expect(chunks[0].top_heading).toBe("My Notes");
		expect(chunks[0].title).toBe("Section 1");
		expect(chunks[0].heading_path).toEqual(["My Notes", "Section 1"]);
		expect(chunks[0].text).toContain("Content of section 1.");
		expect(chunks[1].title).toBe("Section 2");
	});

	test("skips draft files", () => {
		const content = `---
heading: Draft
draft: true
---

## Content

Some content.
`;

		const chunks = parseMarkdown("notes/draft.md", content);

		expect(chunks).toHaveLength(0);
	});

	test("handles content without frontmatter", () => {
		const content = `## Section

Some content here.
`;

		const chunks = parseMarkdown("notes/no-frontmatter.md", content);

		expect(chunks).toHaveLength(1);
		expect(chunks[0].top_heading).toBe("unknown");
	});

	test("handles heading hierarchy with H3 under H2", () => {
		const content = `---
heading: Notes
---

## Parent

### Child

Child content.
`;

		const chunks = parseMarkdown("notes/hierarchy.md", content);

		const childChunk = chunks.find((c) => c.title === "Child");
		expect(childChunk).toBeDefined();
		expect(childChunk?.heading_path).toEqual(["Notes", "Parent", "Child"]);
	});

	test("captures preamble content before first heading", () => {
		const content = `---
heading: Notes
description: My notes
---

Preamble text before any heading.

## First Section

Section content.
`;

		const chunks = parseMarkdown("notes/preamble.md", content);

		expect(chunks).toHaveLength(2);
		expect(chunks[0].title).toBe("My notes");
		expect(chunks[0].text).toContain("Preamble text");
		expect(chunks[0].heading_path).toEqual(["Notes"]);
	});

	test("accepts contentType parameter", () => {
		const content = `---
heading: Book
---

## Chapter 1

Chapter content.
`;

		const chunks = parseMarkdown("books/test.md", content, "books");

		expect(chunks[0].content_type).toBe("books");
	});

	test("generates correct doc_id and chunk_id", () => {
		const content = `---
heading: Test
---

## Section

Content.
`;

		const chunks = parseMarkdown("test.md", content);

		expect(chunks[0].doc_id).toBe("file:test.md");
		expect(chunks[0].chunk_id).toBe("file:test.md#0");
	});
});

describe("parseDbNote", () => {
	test("parses DB note into chunks", () => {
		const chunks = parseDbNote(
			"note-123",
			"My Note Title",
			"Some markdown content.",
		);

		expect(chunks.length).toBeGreaterThan(0);
		expect(chunks[0].doc_id).toBe("db:note:note-123");
		expect(chunks[0].content_type).toBe("notes");
		expect(chunks[0].top_heading).toBe("My Note Title");
		expect(chunks[0].text).toContain("Some markdown content.");
	});

	test("generates synthetic markdown structure", () => {
		const chunks = parseDbNote("456", "Title", "Body text");

		expect(chunks[0].type).toBe("markdown_note");
		expect(chunks[0].title).toBe("Title");
	});
});

describe("parseDbArticle", () => {
	test("parses DB article into a single chunk", () => {
		const chunks = parseDbArticle({
			id: "art-1",
			title: "Test Article",
			url: "https://example.com",
			ogTitle: "OG Title",
			ogDescription: "OG Description",
			quote: "A quote",
			categoryName: "Tech",
		});

		expect(chunks).toHaveLength(1);
		expect(chunks[0].type).toBe("bookmark_json");
		expect(chunks[0].content_type).toBe("articles");
		expect(chunks[0].doc_id).toBe("db:article:art-1");
		expect(chunks[0].chunk_id).toBe("db:article:art-1#0");
		expect(chunks[0].top_heading).toBe("Tech");
		expect(chunks[0].url).toBe("https://example.com");
		expect(chunks[0].text).toBe(
			"Test Article\nOG Title\nOG Description\nA quote",
		);
	});

	test("handles null optional fields", () => {
		const chunks = parseDbArticle({
			id: "art-2",
			title: "Title Only",
			url: "https://example.com",
			ogTitle: null,
			ogDescription: null,
			quote: null,
			categoryName: "General",
		});

		expect(chunks).toHaveLength(1);
		expect(chunks[0].text).toBe("Title Only");
	});

	test("deduplicates ogTitle when matching title", () => {
		const chunks = parseDbArticle({
			id: "art-3",
			title: "Same",
			url: "https://example.com",
			ogTitle: "Same",
			ogDescription: "Desc",
			quote: null,
			categoryName: "General",
		});

		expect(chunks[0].text).toBe("Same\nDesc");
	});

	test("returns empty array for empty text", () => {
		const chunks = parseDbArticle({
			id: "art-4",
			title: "",
			url: "https://example.com",
			ogTitle: null,
			ogDescription: null,
			quote: null,
			categoryName: "General",
		});

		expect(chunks).toHaveLength(0);
	});
});
