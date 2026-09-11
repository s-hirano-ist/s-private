import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { markdownToReact } from "./markdown-viewer";

describe("markdownToReact", () => {
	test("renders GFM and preserves viewer-specific links and headings", async () => {
		const content = await markdownToReact(
			"# Hello World\n\n~~removed~~\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n[external](https://example.com)",
		);
		const html = renderToStaticMarkup(content);

		expect(html).toContain('<h1 id="hello-world">Hello World</h1>');
		expect(html).toContain("<del>removed</del>");
		expect(html).toContain("<table>");
		expect(html).toContain(
			'<a href="https://example.com" rel="nofollow noreferrer" target="_blank">external</a>',
		);
	});

	test("does not parse raw HTML from markdown", async () => {
		const content = await markdownToReact('<script>alert("unsafe")</script>');
		const html = renderToStaticMarkup(content);

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});
});
