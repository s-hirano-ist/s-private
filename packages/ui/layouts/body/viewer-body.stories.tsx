import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import { expect, within } from "storybook/test";
import type { ViewerBodyProps } from "./viewer-body";
import { ViewerBodyClient } from "./viewer-body";

function ViewerBodyWrapper(props: ViewerBodyProps) {
	return (
		<Suspense>
			<ViewerBodyClient {...props} />
		</Suspense>
	);
}

const meta = {
	component: ViewerBodyWrapper,
	parameters: { layout: "padded" },
} satisfies Meta<typeof ViewerBodyWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlainText: Story = {
	args: { markdown: "This is plain text" },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText("This is plain text")).toBeInTheDocument();
	},
};

export const InlineCode: Story = {
	args: { markdown: "This is `inline code` example" },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const codeElement = canvas.getByText("inline code");
		await expect(codeElement.tagName).toBe("CODE");
	},
};

export const CodeBlockWithLanguage: Story = {
	args: { markdown: "```javascript\nconst hello = 'world';\n```" },
	play: async ({ canvasElement }) => {
		const pre = canvasElement.querySelector("pre");
		await expect(pre).toBeInTheDocument();
		const code = canvasElement.querySelector("code");
		await expect(code).toBeInTheDocument();
		// Trailing newline should be stripped
		await expect(canvasElement.textContent).toContain("const hello = 'world';");
	},
};

export const CodeBlockWithoutLanguage: Story = {
	args: { markdown: "```\ncode without language\n```" },
	play: async ({ canvasElement }) => {
		const pre = canvasElement.querySelector("pre");
		await expect(pre).toBeInTheDocument();
	},
};

export const InternalLink: Story = {
	args: { markdown: "[Internal Link](/about)" },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const link = canvas.getByRole("link", { name: "Internal Link" });
		await expect(link).toHaveAttribute("href", "/about");
		await expect(link).not.toHaveAttribute("target");
		await expect(link).not.toHaveAttribute("rel");
	},
};

export const ExternalLink: Story = {
	args: { markdown: "[External Link](https://example.com)" },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const link = canvas.getByRole("link", { name: "External Link" });
		await expect(link).toHaveAttribute("href", "https://example.com");
		await expect(link).toHaveAttribute("target", "_blank");
		await expect(link).toHaveAttribute("rel", "nofollow noreferrer");
	},
};

export const Headings: Story = {
	args: {
		markdown: "# Hello World!\n\n## Section Title\n\n### Sub-Section 123",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const h1 = canvas.getByRole("heading", { level: 1 });
		await expect(h1).toHaveAttribute("id", "hello-world-");
		await expect(h1).toHaveTextContent("Hello World!");

		const h2 = canvas.getByRole("heading", { level: 2 });
		await expect(h2).toHaveAttribute("id", "section-title");
		await expect(h2).toHaveTextContent("Section Title");

		const h3 = canvas.getByRole("heading", { level: 3 });
		await expect(h3).toHaveAttribute("id", "sub-section-123");
		await expect(h3).toHaveTextContent("Sub-Section 123");
	},
};

export const GfmTable: Story = {
	args: {
		markdown:
			"| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const table = canvasElement.querySelector("table");
		await expect(table).toBeInTheDocument();
		await expect(canvas.getByText("Column 1")).toBeInTheDocument();
		await expect(canvas.getByText("Cell 1")).toBeInTheDocument();
	},
};

export const GfmStrikethrough: Story = {
	args: { markdown: "This is ~~strikethrough~~ text" },
	play: async ({ canvasElement }) => {
		const del = canvasElement.querySelector("del");
		await expect(del).toBeInTheDocument();
		await expect(del).toHaveTextContent("strikethrough");
	},
};

export const ComplexMarkdown: Story = {
	args: {
		markdown: `# Main Title

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
- [External](https://external.com)`,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.getByRole("heading", { level: 1 })).toHaveAttribute(
			"id",
			"main-title",
		);
		await expect(canvas.getByRole("heading", { level: 2 })).toHaveAttribute(
			"id",
			"code-section",
		);
		await expect(canvas.getByRole("heading", { level: 3 })).toHaveAttribute(
			"id",
			"links",
		);

		const boldElement = canvas.getByText("bold");
		await expect(boldElement.closest("strong")).toBeInTheDocument();
		const italicElement = canvas.getByText("italic");
		await expect(italicElement.closest("em")).toBeInTheDocument();

		await expect(
			canvas.getByRole("link", { name: "Internal" }),
		).not.toHaveAttribute("target");
		await expect(
			canvas.getByRole("link", { name: "External" }),
		).toHaveAttribute("target", "_blank");
	},
};
