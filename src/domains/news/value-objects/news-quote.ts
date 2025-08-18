import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const newsQuoteSchema = z
	.string()
	.max(256, "Quote must not exceed 256 characters")
	.trim()
	.nullable()
	.optional();

export const NewsQuote = createBrandedType("NewsQuote", newsQuoteSchema);
export type NewsQuote = ReturnType<typeof NewsQuote.create>;

export const newsQuoteValidationRules = {
	isValidLength: (value: string | null | undefined): boolean => {
		if (value === null || value === undefined) return true;
		return value.trim().length <= 256;
	},

	normalize: (value: string | null | undefined): string | null => {
		if (value === null || value === undefined || value.trim() === "") {
			return null;
		}
		return value.trim().replace(/\s+/g, " ");
	},

	sanitize: (value: string | null | undefined): string | null => {
		const normalized = newsQuoteValidationRules.normalize(value);
		if (normalized === null) return null;

		return normalized
			.replace(/[<>]/g, "")
			.replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, "&amp;");
	},

	truncate: (
		value: string | null | undefined,
		maxLength: number = 256,
	): string | null => {
		const normalized = newsQuoteValidationRules.normalize(value);
		if (normalized === null || normalized.length <= maxLength) {
			return normalized;
		}
		return normalized.substring(0, maxLength - 3) + "...";
	},

	hasQuote: (quote: NewsQuote): boolean => {
		const unwrapped = NewsQuote.unwrap(quote);
		return (
			unwrapped !== null &&
			unwrapped !== undefined &&
			unwrapped.trim().length > 0
		);
	},
} as const;
