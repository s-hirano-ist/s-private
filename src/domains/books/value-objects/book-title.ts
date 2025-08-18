import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const bookTitleSchema = z
	.string()
	.min(1, "Book title is required")
	.max(256, "Book title must not exceed 256 characters")
	.trim();

export const BookTitle = createBrandedType("BookTitle", bookTitleSchema);
export type BookTitle = ReturnType<typeof BookTitle.create>;

export const bookTitleValidationRules = {
	isValidLength: (value: string): boolean => {
		return value.trim().length >= 1 && value.trim().length <= 256;
	},

	normalize: (value: string): string => {
		return value.trim().replace(/\s+/g, " ");
	},

	sanitize: (value: string): string => {
		return bookTitleValidationRules
			.normalize(value)
			.replace(/[<>]/g, "")
			.replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, "&amp;");
	},
} as const;
