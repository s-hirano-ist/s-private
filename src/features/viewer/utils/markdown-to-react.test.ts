import { describe, expect, it } from "vitest";
import { markdownToHtml, markdownToReact } from "./markdown-to-react";

describe("Markdown Utility Functions", () => {
	it("should convert markdown to HTML", async () => {
		const markdown = `# Heading\n\nThis is a **bold** text with a [link](https://example.com).`;
		const html = await markdownToHtml(markdown);
		expect(html).toContain('<h1 id="heading">Heading</h1>');
		expect(html).toContain("<strong>bold</strong>");
		expect(html).toContain(
			'<a href="https://example.com" rel="nofollow" target="_blank">link</a>',
		);
	});

	it("should sanitize HTML and parse to React", async () => {
		const markdown = `<script>alert("XSS")</script><h1>Safe Heading</h1>`;
		const reactComponent = await markdownToReact(markdown);
		expect(reactComponent).toBeDefined();
		// The script tag should be removed
		expect(reactComponent).not.toContain('<script>alert("XSS")</script>');
	});
});
