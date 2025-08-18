import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const bookTagSchema = z
	.string()
	.min(1, "Tag cannot be empty")
	.max(50, "Tag must not exceed 50 characters")
	.regex(
		/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_\s]+$/,
		"Tag contains invalid characters",
	);

const bookTagsSchema = z
	.array(bookTagSchema)
	.max(10, "Cannot have more than 10 tags")
	.refine((tags) => {
		const uniqueTags = new Set(tags.map((tag) => tag.toLowerCase().trim()));
		return uniqueTags.size === tags.length;
	}, "Tags must be unique");

export const BookTag = createBrandedType("BookTag", bookTagSchema);
export type BookTag = ReturnType<typeof BookTag.create>;

export const BookTags = createBrandedType("BookTags", bookTagsSchema);
export type BookTags = ReturnType<typeof BookTags.create>;

export const bookTagsValidationRules = {
	isValidTag: (value: string): boolean => {
		return bookTagSchema.safeParse(value).success;
	},

	normalizeTags: (tags: string[]): string[] => {
		return tags
			.map((tag) => tag.trim().toLowerCase())
			.filter((tag) => tag.length > 0)
			.filter((tag, index, self) => self.indexOf(tag) === index)
			.slice(0, 10);
	},

	formatForDisplay: (tags: BookTags): string => {
		const tagArray = BookTags.unwrap(tags);
		return tagArray.map((tag) => `#${tag}`).join(" ");
	},

	searchFilter: (tags: BookTags, query: string): boolean => {
		const tagArray = BookTags.unwrap(tags);
		const normalizedQuery = query.toLowerCase().trim();
		return tagArray.some((tag) => tag.toLowerCase().includes(normalizedQuery));
	},
} as const;
