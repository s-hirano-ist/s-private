import type { Props as ViewerBodyProps } from "./viewer-body";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import { expect } from "storybook/test";
import { ViewerBody } from "./viewer-body";

function ViewerBodyWrapper({ slug, getBookByISBN }: ViewerBodyProps) {
	return (
		<Suspense>
			<ViewerBody getBookByISBN={getBookByISBN} slug={slug} />
		</Suspense>
	);
}

const meta = {
	component: ViewerBodyWrapper,
	parameters: { layout: "padded" },
	argTypes: {
		slug: { control: "text" },
		getBookByISBN: { action: "getBookByISBN" },
	},
} satisfies Meta<typeof ViewerBodyWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockBookData = Object.freeze({
	id: "00000000-0000-7000-8000-000000000101",
	userId: "mock-user-id",
	isbn: "9780123456789",
	title: "TypeScript Handbook",
	markdown:
		"# TypeScript Handbook\n\nThis is a comprehensive guide to TypeScript.\n\n## Getting Started\n\nTypeScript is a typed superset of JavaScript...",
	googleSubTitle: "The Complete Guide",
	googleDescription:
		"A comprehensive guide to TypeScript programming language with practical examples and best practices.",
	googleAuthors: ["Microsoft TypeScript Team", "Anders Hejlsberg"],
	googleHref: "https://www.typescriptlang.org/docs/",
	googleImgSrc: "https://picsum.photos/id/1/192/192",
	imagePath: undefined,
	status: "EXPORTED" as const,
	createdAt: new Date("2024-01-01"),
	exportedAt: new Date("2024-01-01"),
	rating: 4,
});

export const Default: Story = {
	args: {
		slug: "978-0123456789",
		getBookByISBN: async () => mockBookData,
	},
};

export const WithLongContent: Story = {
	args: {
		slug: "978-0123456789",
		getBookByISBN: async () => ({
			...mockBookData,
			markdown: `# TypeScript Handbook

This is a comprehensive guide to TypeScript.

## Table of Contents

1. [Introduction](#introduction)
2. [Basic Types](#basic-types)
3. [Interfaces](#interfaces)
4. [Classes](#classes)
5. [Functions](#functions)
6. [Generics](#generics)

## Introduction

TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.

## Basic Types

TypeScript supports the following basic types:

- \`boolean\`
- \`number\`
- \`string\`
- \`array\`
- \`tuple\`
- \`enum\`
- \`any\`
- \`void\`
- \`null\`
- \`undefined\`

\`\`\`typescript
let isDone: boolean = false;
let decimal: number = 6;
let color: string = "blue";
\`\`\`

## Interfaces

Interfaces define the shape of objects:

\`\`\`typescript
type Person = {
  name: string;
  age: number;
};
\`\`\``,
		}),
	},
};

export const MinimalData: Story = {
	args: {
		slug: "978-0123456789",
		getBookByISBN: async () =>
			Object.freeze({
				id: "00000000-0000-7000-8000-000000000101",
				userId: "mock-user-id",
				isbn: "9780123456789",
				title: "Minimal Book",
				markdown: "# Minimal Book\n\nJust some basic content.",
				googleSubTitle: null,
				googleDescription: null,
				googleAuthors: null,
				googleHref: null,
				googleImgSrc: null,
				imagePath: undefined,
				status: "EXPORTED" as const,
				createdAt: new Date("2024-01-01"),
				exportedAt: new Date("2024-01-01"),
				rating: 3,
			}),
	},
};

export const WithoutImage: Story = {
	args: {
		slug: "978-0123456789",
		getBookByISBN: async () => ({
			...mockBookData,
			googleImgSrc: null,
		}),
	},
};

// Note: NotFound story removed to avoid timeout issues in Storybook
// The component calls notFound() which causes navigation issues in the isolated Storybook environment

export const UploadedCover: Story = {
	args: {
		slug: mockBookData.isbn,
		getBookByISBN: async () => ({
			...mockBookData,
			imagePath: "uploaded-cover.png",
		}),
	},
	play: async ({ canvas }) => {
		await expect(
			await canvas.findByRole("img", {
				name: `${mockBookData.title} (uploaded)`,
			}),
		).toBeVisible();
	},
};
