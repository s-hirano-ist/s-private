import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { ViewerBody } from "./viewer-body";

type BookData = {
	id: string;
	ISBN: string;
	title: string;
	markdown?: string;
	googleTitle?: string;
	googleSubTitle?: string;
	googleDescription?: string;
	googleAuthors?: string[];
	googleHref?: string;
	googleImgSrc?: string;
};

type ViewerBodyWrapperProps = {
	slug: string;
	getBookByISBN: (isbn: string) => Promise<BookData | null>;
};

function ViewerBodyWrapper({ slug, getBookByISBN }: ViewerBodyWrapperProps) {
	return (
		<Suspense>
			<ViewerBody getBookByISBN={getBookByISBN} slug={slug} />
		</Suspense>
	);
}

const meta = {
	component: ViewerBodyWrapper,
	parameters: { layout: "padded" },
	tags: ["autodocs"],
	argTypes: {
		slug: { control: "text" },
		getBookByISBN: { action: "getBookByISBN" },
	},
} satisfies Meta<typeof ViewerBodyWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockBookData: BookData = {
	id: "01234567-89ab-4def-9123-456789abcdef",
	ISBN: "978-0123456789",
	title: "TypeScript Handbook",
	markdown:
		"# TypeScript Handbook\n\nThis is a comprehensive guide to TypeScript.\n\n## Getting Started\n\nTypeScript is a typed superset of JavaScript...",
	googleTitle: "TypeScript Handbook",
	googleSubTitle: "The Complete Guide",
	googleDescription:
		"A comprehensive guide to TypeScript programming language with practical examples and best practices.",
	googleAuthors: ["Microsoft TypeScript Team", "Anders Hejlsberg"],
	googleHref: "https://www.typescriptlang.org/docs/",
	googleImgSrc: "https://picsum.photos/id/1/192/192",
};

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
interface Person {
  name: string;
  age: number;
}
\`\`\``,
		}),
	},
};

export const MinimalData: Story = {
	args: {
		slug: "978-0123456789",
		getBookByISBN: async () => ({
			id: "01234567-89ab-4def-9123-456789abcdef",
			ISBN: "978-0123456789",
			title: "Minimal Book",
			markdown: "# Minimal Book\n\nJust some basic content.",
		}),
	},
};

export const WithoutImage: Story = {
	args: {
		slug: "978-0123456789",
		getBookByISBN: async () => ({
			...mockBookData,
			googleImgSrc: undefined,
		}),
	},
};

// Note: NotFound story removed to avoid timeout issues in Storybook
// The component calls notFound() which causes navigation issues in the isolated Storybook environment
