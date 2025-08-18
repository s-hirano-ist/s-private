import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import { ViewerBody } from "./viewer-body";

type ContentData = {
	id: string;
	title: string;
	markdown: string;
};

type ViewerBodyWrapperProps = {
	slug: string;
	getContentByTitle: (title: string) => Promise<ContentData | null>;
};

function ViewerBodyWrapper({
	slug,
	getContentByTitle,
}: ViewerBodyWrapperProps) {
	return (
		<Suspense>
			<ViewerBody getContentByTitle={getContentByTitle} slug={slug} />
		</Suspense>
	);
}

const meta = {
	component: ViewerBodyWrapper,
	parameters: { layout: "padded" },
	tags: ["autodocs"],
	argTypes: {
		slug: { control: "text" },
		getContentByTitle: { action: "getContentByTitle" },
	},
} satisfies Meta<typeof ViewerBodyWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleMarkdown = `# Sample Content

This is a sample content article.

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
		slug: "sample-content",
		getContentByTitle: async () => ({
			id: "01234567-89ab-7def-9123-456789abcdef",
			title: "Sample Content",
			markdown: sampleMarkdown,
		}),
	},
};

export const WithEncodedSlug: Story = {
	args: {
		slug: encodeURIComponent("Sample Content with Spaces"),
		getContentByTitle: async (title) => {
			if (title === "Sample Content with Spaces") {
				return {
					id: "01234567-89ab-7def-9123-456789abcdef",
					title: title,
					markdown: sampleMarkdown,
				};
			}
			return null;
		},
	},
};

export const LongContent: Story = {
	args: {
		slug: "comprehensive-guide",
		getContentByTitle: async () => ({
			id: "01234567-89ab-7def-9123-456789abcdef",
			title: "Comprehensive Guide",
			markdown: longMarkdown,
		}),
	},
};

export const MinimalContent: Story = {
	args: {
		slug: "minimal",
		getContentByTitle: async () => ({
			id: "01234567-89ab-7def-9123-456789abcdef",
			title: "Minimal Content",
			markdown: "# Minimal Content\n\nJust a simple line.",
		}),
	},
};

// Note: NotFound story removed to avoid timeout issues in Storybook
// The component calls notFound() which causes navigation issues in the isolated Storybook environment
