import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/**
 * Badge style variants using class-variance-authority.
 *
 * @remarks
 * Provides consistent styling for badge components with multiple visual variants.
 *
 * @example
 * ```typescript
 * const className = badgeVariants({ variant: "secondary" });
 * ```
 */
const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border-primary/20 bg-primary/10 text-primary hover:bg-primary/20",
				secondary:
					"border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
				destructive:
					"border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20",
				outline: "border-muted bg-muted/50 text-muted-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

/**
 * Props for the Badge component.
 *
 * @see {@link Badge} for the component
 * @see {@link badgeVariants} for available variants
 */
export type BadgeProps = {} & React.HTMLAttributes<HTMLDivElement> &
	VariantProps<typeof badgeVariants>;

/**
 * A small status indicator component for labels, counts, or statuses.
 *
 * @remarks
 * Badges are used to highlight information like status, counts, or labels.
 * Built on top of class-variance-authority for consistent styling.
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
