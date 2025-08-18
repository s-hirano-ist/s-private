import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const markdownContentSchema = z
	.string()
	.min(1, "Markdown content is required")
	.max(100000, "Markdown content is too long"); // 100KB limit

export const MarkdownContent = createBrandedType(
	"MarkdownContent",
	markdownContentSchema,
);
export type MarkdownContent = ReturnType<typeof MarkdownContent.create>;

export const markdownContentValidationRules = {
	isValidLength: (value: string): boolean => {
		return value.length >= 1 && value.length <= 100000;
	},

	extractHeadings: (content: MarkdownContent): string[] => {
		const markdown = MarkdownContent.unwrap(content);
		const headingRegex = /^#+\s+(.+)$/gm;
		const headings: string[] = [];
		let match;

		while ((match = headingRegex.exec(markdown)) !== null) {
			headings.push(match[1].trim());
		}

		return headings;
	},

	extractWords: (content: MarkdownContent): string[] => {
		const markdown = MarkdownContent.unwrap(content);
		// Remove markdown syntax and extract words
		const plainText = markdown
			.replace(/```[\s\S]*?```/g, "") // Remove code blocks
			.replace(/`[^`]*`/g, "") // Remove inline code
			.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // Extract link text
			.replace(/[#*_~`]/g, "") // Remove markdown formatting
			.replace(/[^\w\s]/g, " "); // Replace punctuation with spaces

		return plainText
			.split(/\s+/)
			.filter((word) => word.length > 0)
			.map((word) => word.toLowerCase());
	},

	getWordCount: (content: MarkdownContent): number => {
		return markdownContentValidationRules.extractWords(content).length;
	},

	hasCodeBlocks: (content: MarkdownContent): boolean => {
		const markdown = MarkdownContent.unwrap(content);
		return /```[\s\S]*?```/.test(markdown) || /`[^`]*`/.test(markdown);
	},

	hasLinks: (content: MarkdownContent): boolean => {
		const markdown = MarkdownContent.unwrap(content);
		return /\[([^\]]*)\]\([^)]*\)/.test(markdown);
	},

	hasImages: (content: MarkdownContent): boolean => {
		const markdown = MarkdownContent.unwrap(content);
		return /!\[([^\]]*)\]\([^)]*\)/.test(markdown);
	},
} as const;
