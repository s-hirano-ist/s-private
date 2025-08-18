import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const ratingSchema = z
	.number()
	.int("Rating must be an integer")
	.min(1, "Rating must be at least 1")
	.max(5, "Rating must be at most 5");

export const Rating = createBrandedType("Rating", ratingSchema);
export type Rating = ReturnType<typeof Rating.create>;

export const ratingValidationRules = {
	isValidRange: (value: number): boolean => {
		return Number.isInteger(value) && value >= 1 && value <= 5;
	},

	toStars: (rating: Rating): string => {
		const value = Rating.unwrap(rating);
		return "★".repeat(value) + "☆".repeat(5 - value);
	},

	fromStars: (stars: string): number => {
		return stars.split("★").length - 1;
	},

	toPercentage: (rating: Rating): number => {
		const value = Rating.unwrap(rating);
		return (value / 5) * 100;
	},
} as const;
