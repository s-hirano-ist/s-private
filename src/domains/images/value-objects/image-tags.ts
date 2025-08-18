import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const imageTagSchema = z
	.string()
	.min(1, "Tag cannot be empty")
	.max(50, "Tag must not exceed 50 characters")
	.regex(
		/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_\s]+$/,
		"Tag contains invalid characters",
	);

const imageTagsSchema = z
	.array(imageTagSchema)
	.max(20, "Cannot have more than 20 tags")
	.refine((tags) => {
		const uniqueTags = new Set(tags.map((tag) => tag.toLowerCase().trim()));
		return uniqueTags.size === tags.length;
	}, "Tags must be unique");

export const ImageTag = createBrandedType("ImageTag", imageTagSchema);
export type ImageTag = ReturnType<typeof ImageTag.create>;

export const ImageTags = createBrandedType("ImageTags", imageTagsSchema);
export type ImageTags = ReturnType<typeof ImageTags.create>;

export const imageTagsValidationRules = {
	isValidTag: (value: string): boolean => {
		return imageTagSchema.safeParse(value).success;
	},

	normalizeTags: (tags: string[]): string[] => {
		return tags
			.map((tag) => tag.trim().toLowerCase())
			.filter((tag) => tag.length > 0)
			.filter((tag, index, self) => self.indexOf(tag) === index)
			.slice(0, 20);
	},

	formatForDisplay: (tags: ImageTags): string => {
		const tagArray = ImageTags.unwrap(tags);
		return tagArray.map((tag) => `#${tag}`).join(" ");
	},

	searchFilter: (tags: ImageTags, query: string): boolean => {
		const tagArray = ImageTags.unwrap(tags);
		const normalizedQuery = query.toLowerCase().trim();
		return tagArray.some((tag) => tag.toLowerCase().includes(normalizedQuery));
	},

	categorizeByType: (
		tags: ImageTags,
	): {
		colors: string[];
		objects: string[];
		concepts: string[];
		technical: string[];
		other: string[];
	} => {
		const tagArray = ImageTags.unwrap(tags);
		const categories = {
			colors: [] as string[],
			objects: [] as string[],
			concepts: [] as string[],
			technical: [] as string[],
			other: [] as string[],
		};

		const colorKeywords = [
			"red",
			"blue",
			"green",
			"yellow",
			"black",
			"white",
			"orange",
			"purple",
			"pink",
			"brown",
		];
		const technicalKeywords = [
			"hd",
			"uhd",
			"4k",
			"portrait",
			"landscape",
			"macro",
			"wide",
			"close-up",
		];

		tagArray.forEach((tag) => {
			const lowerTag = tag.toLowerCase();
			if (colorKeywords.some((color) => lowerTag.includes(color))) {
				categories.colors.push(tag);
			} else if (technicalKeywords.some((tech) => lowerTag.includes(tech))) {
				categories.technical.push(tag);
			} else {
				categories.other.push(tag);
			}
		});

		return categories;
	},
} as const;
