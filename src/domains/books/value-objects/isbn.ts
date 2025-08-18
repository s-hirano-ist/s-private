import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const isbnSchema = z
	.string()
	.min(1, "ISBN is required")
	.max(17, "ISBN must not exceed 17 characters")
	.regex(/^[\d-]+$/, "ISBN must contain only digits and hyphens")
	.refine((isbn) => {
		const digits = isbn.replace(/-/g, "");
		return digits.length === 10 || digits.length === 13;
	}, "ISBN must be 10 or 13 digits");

export const ISBN = createBrandedType("ISBN", isbnSchema);
export type ISBN = ReturnType<typeof ISBN.create>;

export const isbnValidationRules = {
	isValidFormat: (value: string): boolean => {
		return /^[\d-]+$/.test(value);
	},

	isValidLength: (value: string): boolean => {
		const digits = value.replace(/-/g, "");
		return digits.length === 10 || digits.length === 13;
	},

	normalize: (value: string): string => {
		return value.replace(/-/g, "");
	},

	format: (value: string): string => {
		const normalized = isbnValidationRules.normalize(value);
		if (normalized.length === 10) {
			return `${normalized.slice(0, 3)}-${normalized.slice(3, 9)}-${normalized.slice(9)}`;
		}
		if (normalized.length === 13) {
			return `${normalized.slice(0, 3)}-${normalized.slice(3, 4)}-${normalized.slice(4, 9)}-${normalized.slice(9, 12)}-${normalized.slice(12)}`;
		}
		return value;
	},
} as const;
