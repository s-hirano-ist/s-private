import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const newsTitleSchema = z
	.string()
	.min(1, "News title is required")
	.max(64, "News title must not exceed 64 characters")
	.trim();

export const NewsTitle = createBrandedType("NewsTitle", newsTitleSchema);
export type NewsTitle = ReturnType<typeof NewsTitle.create>;

export const newsTitleValidationRules = {
	isValidLength: (value: string): boolean => {
		return value.trim().length >= 1 && value.trim().length <= 64;
	},

	normalize: (value: string): string => {
		return value.trim().replace(/\s+/g, " ");
	},

	sanitize: (value: string): string => {
		return newsTitleValidationRules
			.normalize(value)
			.replace(/[<>]/g, "")
			.replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, "&amp;");
	},

	truncate: (value: string, maxLength: number = 64): string => {
		const normalized = newsTitleValidationRules.normalize(value);
		if (normalized.length <= maxLength) {
			return normalized;
		}
		return normalized.substring(0, maxLength - 3) + "...";
	},
} as const;
