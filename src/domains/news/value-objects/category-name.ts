import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const categoryNameSchema = z
	.string()
	.trim()
	.min(1, "Category name is required")
	.max(16, "Category name must not exceed 16 characters")
	.regex(
		/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_\s]+$/,
		"Category name contains invalid characters",
	);

export const CategoryName = createBrandedType(
	"CategoryName",
	categoryNameSchema,
);
export type CategoryName = ReturnType<typeof CategoryName.create>;

export const categoryNameValidationRules = {
	isValidLength: (value: string): boolean => {
		return value.trim().length >= 1 && value.trim().length <= 16;
	},

	isValidFormat: (value: string): boolean => {
		return /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_\s]+$/.test(
			value,
		);
	},

	normalize: (value: string): string => {
		return value.trim().replace(/\s+/g, " ");
	},

	sanitize: (value: string): string => {
		return categoryNameValidationRules
			.normalize(value)
			.replace(/[<>]/g, "")
			.replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, "&amp;");
	},

	toSlug: (value: CategoryName): string => {
		const name = CategoryName.unwrap(value);
		return name
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9\-]/g, "");
	},

	isReservedName: (value: string): boolean => {
		const reserved = ["admin", "system", "default", "null", "undefined"];
		return reserved.includes(value.toLowerCase().trim());
	},
} as const;
