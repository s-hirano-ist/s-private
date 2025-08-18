import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const contentTitleSchema = z
	.string()
	.min(1, "Content title is required")
	.max(64, "Content title must not exceed 64 characters")
	.trim();

export const ContentTitle = createBrandedType(
	"ContentTitle",
	contentTitleSchema,
);
export type ContentTitle = ReturnType<typeof ContentTitle.create>;

export const contentTitleValidationRules = {
	isValidLength: (value: string): boolean => {
		return value.trim().length >= 1 && value.trim().length <= 64;
	},

	normalize: (value: string): string => {
		return value.trim().replace(/\s+/g, " ");
	},

	sanitize: (value: string): string => {
		return contentTitleValidationRules
			.normalize(value)
			.replace(/[<>]/g, "")
			.replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, "&amp;");
	},

	toSlug: (value: ContentTitle): string => {
		const title = ContentTitle.unwrap(value);
		return title
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9\-]/g, "");
	},
} as const;
