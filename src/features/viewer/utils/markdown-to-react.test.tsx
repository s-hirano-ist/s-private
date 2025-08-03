import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { markdownToReact } from "./markdown-to-react";

describe("markdownToReact", () => {
	test("should render plain text", async () => {
		const markdown = "This is plain text";
		const result = await markdownToReact(markdown);

		const { container } = render(result);
		expect(container.textContent).toBe("This is plain text");
	});

	test("should render inline code", async () => {
		const markdown = "This is `inline code` example";
		const result = await markdownToReact(markdown);

		render(result);
		const codeElement = screen.getByText("inline code");
		expect(codeElement.tagName).toBe("CODE");
		expect(codeElement).not.toHaveClass("language-");
	});

	test("should render code blocks with syntax highlighting", async () => {
		const markdown = "```javascript\nconst hello = 'world';\n```";
		const result = await markdownToReact(markdown);

		const { container } = render(result);
		const preElement = container.querySelector("pre");
		expect(preElement).toBeInTheDocument();
		// SyntaxHighlighter renders with inline styles
		const codeElement = container.querySelector("code");
		expect(codeElement).toBeInTheDocument();
	});

	test("should render internal links without attributes", async () => {
		const markdown = "[Internal Link](/about)";
		const result = await markdownToReact(markdown);

		render(result);
		const link = screen.getByRole("link", { name: "Internal Link" });
		expect(link).toHaveAttribute("href", "/about");
		expect(link).not.toHaveAttribute("target");
		expect(link).not.toHaveAttribute("rel");
	});

	test("should render external links with security attributes", async () => {
		const markdown = "[External Link](https://example.com)";
		const result = await markdownToReact(markdown);

		render(result);
		const link = screen.getByRole("link", { name: "External Link" });
		expect(link).toHaveAttribute("href", "https://example.com");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "nofollow noreferrer");
	});

	test("should render h1 with generated id", async () => {
		const markdown = "# Hello World!";
		const result = await markdownToReact(markdown);

		render(result);
		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading).toHaveAttribute("id", "hello-world-");
		expect(heading).toHaveTextContent("Hello World!");
	});

	test("should render h2 with generated id", async () => {
		const markdown = "## Section Title";
		const result = await markdownToReact(markdown);

		render(result);
		const heading = screen.getByRole("heading", { level: 2 });
		expect(heading).toHaveAttribute("id", "section-title");
		expect(heading).toHaveTextContent("Section Title");
	});

	test("should render h3 with generated id", async () => {
		const markdown = "### Sub-Section 123";
		const result = await markdownToReact(markdown);

		render(result);
		const heading = screen.getByRole("heading", { level: 3 });
		expect(heading).toHaveAttribute("id", "sub-section-123");
		expect(heading).toHaveTextContent("Sub-Section 123");
	});

	test("should handle GFM features like tables", async () => {
		const markdown = `
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
		const result = await markdownToReact(markdown);

		const { container } = render(result);
		const table = container.querySelector("table");
		expect(table).toBeInTheDocument();
		expect(screen.getByText("Column 1")).toBeInTheDocument();
		expect(screen.getByText("Cell 1")).toBeInTheDocument();
	});

	test("should handle strikethrough from GFM", async () => {
		const markdown = "This is ~~strikethrough~~ text";
		const result = await markdownToReact(markdown);

		const { container } = render(result);
		const del = container.querySelector("del");
		expect(del).toBeInTheDocument();
		expect(del).toHaveTextContent("strikethrough");
	});

	test("should handle code blocks without language", async () => {
		const markdown = "```\ncode without language\n```";
		const result = await markdownToReact(markdown);

		const { container } = render(result);
		const preElement = container.querySelector("pre");
		expect(preElement).toBeInTheDocument();
	});

	test("should strip trailing newline from code blocks", async () => {
		const markdown = "```javascript\nconst test = true;\n```";
		const result = await markdownToReact(markdown);

		const { container } = render(result);
		expect(container.textContent).toContain("const test = true;");
		expect(container.textContent).not.toMatch(/const test = true;\n$/);
	});

	test("should handle complex markdown with multiple elements", async () => {
		const markdown = `
# Main Title

This is a paragraph with **bold** and *italic* text.

## Code Section

Here's some code:

\`\`\`typescript
interface User {
  name: string;
  age: number;
}
\`\`\`

### Links

- [Internal](/internal)
- [External](https://external.com)
`;
		const result = await markdownToReact(markdown);

		render(result);

		expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute(
			"id",
			"main-title",
		);
		expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute(
			"id",
			"code-section",
		);
		expect(screen.getByRole("heading", { level: 3 })).toHaveAttribute(
			"id",
			"links",
		);
		expect(screen.getByText("bold")).toHaveStyle("font-weight: bold");
		expect(screen.getByText("italic")).toHaveStyle("font-style: italic");
		expect(screen.getByRole("link", { name: "Internal" })).not.toHaveAttribute(
			"target",
		);
		expect(screen.getByRole("link", { name: "External" })).toHaveAttribute(
			"target",
			"_blank",
		);
	});
});
