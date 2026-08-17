import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "./utils/cn";

/**
 * Badge style variants using tailwind-variants.
 *
 * @remarks
 * Provides consistent styling for badge components with multiple visual variants.
 *
 * @example
 * ```typescript
 * const className = badgeVariants({ variant: "secondary" });
 * ```
 */
const badgeVariants = tv({
	base: "sui:inline-flex sui:items-center sui:rounded-full sui:border sui:px-3 sui:py-0.5 sui:text-xs sui:font-medium sui:transition-colors sui:focus:ring-2 sui:focus:ring-primary sui:focus:ring-offset-2 sui:focus:outline-hidden",
	variants: {
		variant: {
			default:
				"sui:border-primary/20 sui:bg-primary/5 sui:text-primary sui:hover:bg-primary/10",
			secondary:
				"sui:border-transparent sui:bg-muted sui:text-muted-foreground sui:hover:bg-muted/80",
			destructive:
				"sui:border-transparent sui:bg-destructive/10 sui:text-destructive sui:hover:bg-destructive/20",
			outline: "sui:border-muted sui:bg-muted/50 sui:text-muted-foreground",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

/**
 * Props for the Badge component.
 *
 * @see {@link Badge} for the component
 * @see {@link badgeVariants} for available variants
 */
export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
	VariantProps<typeof badgeVariants>;

/**
 * A small status indicator component for labels, counts, or statuses.
 *
 * @remarks
 * Badges are used to highlight information like status, counts, or labels.
 * Built on top of tailwind-variants for consistent styling.
 *
 * @param props - Badge props including variant and standard div attributes
 * @returns A styled badge element
 *
 * @example
 * ```tsx
 * // Default badge
 * <Badge>New</Badge>
 *
 * // Secondary variant
 * <Badge variant="secondary">Draft</Badge>
 *
 * // Destructive variant for warnings
 * <Badge variant="destructive">Error</Badge>
 * ```
 *
 * @see {@link badgeVariants} for available style variants
 */
function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
