import {
	makeMarkdown,
	makeNoteTitle,
} from "@s-hirano-ist/s-core/notes/entities/note-entity";
import {
	makeCreatedAt,
	makeExportedAt,
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import type { Props as ViewerBodyProps } from "./viewer-body";
import { ViewerBody } from "./viewer-body";

function ViewerBodyWrapper({ slug, getNoteByTitle }: ViewerBodyProps) {
	return (
		<Suspense>
			<ViewerBody getNoteByTitle={getNoteByTitle} slug={slug} />
		</Suspense>
	);
}

const meta = {
	component: ViewerBodyWrapper,
	parameters: { layout: "padded" },
	argTypes: {
		slug: { control: "text" },
		getNoteByTitle: { action: "getNoteByTitle" },
	},
} satisfies Meta<typeof ViewerBodyWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleMarkdown = `# Sample Note

This is a sample note article.

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## Features

- Feature 1
- Feature 2
- Feature 3

## Conclusion

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`;

const longMarkdown = `# Comprehensive Guide

This is a very detailed guide with lots of content.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Advanced Topics](#advanced-topics)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

## Overview

This section provides an overview of the topic.

### Key Concepts

- Concept A
- Concept B
- Concept C

## Getting Started

Follow these steps to get started:

1. Step 1: Installation
2. Step 2: Configuration
3. Step 3: First use

### Installation

\`\`\`bash
npm install example-package
\`\`\`

### Configuration

\`\`\`json
{
  "setting1": "value1",
  "setting2": "value2"
}
\`\`\`

## Advanced Topics

### Topic 1

Detailed explanation of topic 1.

### Topic 2

Detailed explanation of topic 2.

## Best Practices

- Practice 1
- Practice 2
- Practice 3

## Troubleshooting

### Common Issues

**Issue 1**: Description and solution.

**Issue 2**: Description and solution.`;

export const Default: Story = {
	args: {
		slug: "sample-note",
		getNoteByTitle: async () =>
			Object.freeze({
				id: makeId(),
				userId: makeUserId("mock-user-id"),
				title: makeNoteTitle("Sample Note"),
				markdown: makeMarkdown(sampleMarkdown),
				status: "EXPORTED" as const,
				createdAt: makeCreatedAt(new Date("2024-01-01")),
				exportedAt: makeExportedAt(new Date("2024-01-01")),
			}),
	},
};

export const WithEncodedSlug: Story = {
	args: {
		slug: encodeURIComponent("Sample Note with Spaces"),
		getNoteByTitle: async (title) => {
			if (title === "Sample Note with Spaces") {
				return Object.freeze({
					id: makeId(),
					userId: makeUserId("mock-user-id"),
					title: makeNoteTitle(title),
					markdown: makeMarkdown(sampleMarkdown),
					status: "EXPORTED" as const,
					createdAt: makeCreatedAt(new Date("2024-01-01")),
					exportedAt: makeExportedAt(new Date("2024-01-01")),
				});
			}
			return null;
		},
	},
};

export const LongContent: Story = {
	args: {
		slug: "comprehensive-guide",
		getNoteByTitle: async () =>
			Object.freeze({
				id: makeId(),
				userId: makeUserId("mock-user-id"),
				title: makeNoteTitle("Comprehensive Guide"),
				markdown: makeMarkdown(longMarkdown),
				status: "EXPORTED" as const,
				createdAt: makeCreatedAt(new Date("2024-01-01")),
				exportedAt: makeExportedAt(new Date("2024-01-01")),
			}),
	},
};

export const MinimalContent: Story = {
	args: {
		slug: "minimal",
		getNoteByTitle: async () =>
			Object.freeze({
				id: makeId(),
				userId: makeUserId("mock-user-id"),
				title: makeNoteTitle("Minimal Note"),
				markdown: makeMarkdown("# Minimal Note\n\nJust a simple line."),
				status: "EXPORTED" as const,
				createdAt: makeCreatedAt(new Date("2024-01-01")),
				exportedAt: makeExportedAt(new Date("2024-01-01")),
			}),
	},
};

// Note: NotFound story removed to avoid timeout issues in Storybook
// The component calls notFound() which causes navigation issues in the isolated Storybook environment
