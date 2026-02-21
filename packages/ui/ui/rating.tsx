import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "../utils/cn";

const ratingVariants = cva("flex gap-0.5", {
	variants: {
		size: {
			sm: "[&_svg]:size-3",
			md: "[&_svg]:size-4",
			lg: "[&_svg]:size-5",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

/**
 * Props for the Rating component.
 *
 * @see {@link Rating} for the component
 */
export type RatingProps = {
	/** Current rating value (1 to maxRating) */
	rating: number;
	/** Maximum rating value */
	maxRating?: number;
	/** Forwarded ref */
	ref?: React.Ref<HTMLDivElement>;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children"> &
	VariantProps<typeof ratingVariants>;

/**
 * A read-only star rating display component.
 *
 * @param props - Rating props including rating value, maxRating, and size
 * @returns A row of star SVG icons
 *
 * @example
 * ```tsx
 * <Rating rating={3} />
 * <Rating rating={4} maxRating={5} size="lg" />
 * ```
 */
function Rating({
	rating,
	maxRating = 5,
	size,
	className,
	ref,
	...props
}: RatingProps) {
	return (
		<div
			aria-label={`Rating: ${rating} out of ${maxRating}`}
			className={cn(ratingVariants({ size }), className)}
			ref={ref}
			role="img"
			{...props}
		>
			{[...Array(maxRating).keys()].map((i) => (
				<svg
					aria-hidden="true"
					className={cn(
						i < rating
							? "fill-yellow-400 text-yellow-400"
							: "fill-muted text-muted",
					)}
					key={i}
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
				</svg>
			))}
		</div>
	);
}
Rating.displayName = "Rating";

export { Rating, ratingVariants };
