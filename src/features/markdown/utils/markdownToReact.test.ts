import parse from "html-react-parser";
import DOMPurify from "isomorphic-dompurify";
import { unified } from "unified";
import { describe, expect, it, vi } from "vitest";
import { markdownToReact } from "./markdownToReact";

vi.mock("unified", () => ({
	unified: vi.fn().mockReturnValue({
		use: vi.fn().mockReturnThis(),
		process: vi.fn(),
	}),
}));

vi.mock("isomorphic-dompurify", () => {
	return {
		__esModule: true,
		default: { sanitize: vi.fn() },
	};
});

vi.mock("html-react-parser", () => ({
	default: vi.fn(),
}));

describe("markdownToReact", () => {
	const markdown = `
# Heading 1

This is a **bold** text and [a link](https://example.com).

\`\`\`javascript
console.log('Hello, World!');
\`\`\`
`;

	const mockHtml = `
<h1>Heading 1</h1>
<p>This is a <strong>bold</strong> text and <a href="https://example.com">a link</a>.</p>
<pre><code class="language-javascript">console.log('Hello, World!');</code></pre>
`;

	const sanitizedHtml = `
<h1>Heading 1</h1>
<p>This is a <strong>bold</strong> text and <a href="https://example.com" rel="nofollow" target="_blank">a link</a>.</p>
<pre><code class="language-javascript">console.log('Hello, World!');</code></pre>
`;

	it("should convert Markdown to React components", async () => {
		const mockVFile = {
			toString: () => mockHtml,
			value: mockHtml,
		};

		// @ts-expect-error: テスト目的で型外の値を渡す
		vi.mocked(unified().process).mockResolvedValue(mockVFile);

		vi.mocked(DOMPurify.sanitize).mockReturnValue(sanitizedHtml);
		vi.mocked(parse).mockReturnValue("<ReactComponent />");

		// 実行
		const result = await markdownToReact(markdown);

		// 検証
		expect(unified().process).toHaveBeenCalledWith(markdown);
		expect(DOMPurify.sanitize).toHaveBeenCalledWith(mockHtml);
		expect(parse).toHaveBeenCalledWith(sanitizedHtml);
		expect(result).toBe("<ReactComponent />");
	});

	it("should sanitize the generated HTML", async () => {
		// @ts-expect-error: テスト目的で型外の値を渡す
		vi.mocked(unified().process).mockResolvedValue({
			toString: () => mockHtml,
		});
		vi.mocked(DOMPurify.sanitize).mockReturnValue(sanitizedHtml);

		const result = await markdownToReact(markdown);

		expect(DOMPurify.sanitize).toHaveBeenCalledWith(mockHtml);
		expect(result).toBe("<ReactComponent />");
	});

	it("should throw an error if processing fails", async () => {
		const error = new Error("Processing failed");
		vi.mocked(unified().process).mockRejectedValue(error);

		await expect(markdownToReact(markdown)).rejects.toThrow(
			"Processing failed",
		);
	});
});
