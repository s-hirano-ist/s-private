import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../utils/cn";

/**
 * Button style variants using class-variance-authority.
 *
 * @remarks
 * Provides consistent button styling with multiple visual variants and sizes.
 *
 * Variants:
 * - `default` - Primary gradient button
 * - `destructive` - Red button for dangerous actions
 * - `outline` - Bordered button with transparent background
 * - `secondary` - Muted background button
 * - `ghost` - Minimal button with hover effect only
 * - `link` - Underlined text link style
 * - `navSide` - Navigation sidebar button
 * - `navCenter` - Centered navigation button
 *
 * @example
 * ```typescript
 * const className = buttonVariants({ variant: "outline", size: "lg" });
 * ```
 */
const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default:
					"bg-linear-to-r from-primary to-primary-grad text-white shadow-sm hover:bg-primary/40",
				destructive:
					"bg-destructive text-white shadow-xs hover:bg-destructive/80",
				outline:
					"border border-muted bg-background shadow-xs hover:bg-muted hover:text-muted-foreground",
				secondary: "bg-muted text-muted-foreground shadow-xs hover:bg-muted/80",
				ghost: "hover:text-primary",
				link: "text-white underline-offset-4 hover:underline",
				navSide: "hover:bg-black/40 dark:hover:bg-gray-800",
				navCenter: "bg-white font-medium hover:bg-black/40",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 rounded-md px-3 text-xs",
				lg: "h-10 rounded-md px-8",
				icon: "size-9",
				navSide: "size-full",
				navCenter: "size-14 rounded-full",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

/**
 * Props for the Button component.
 *
 * @see {@link Button} for the component
 * @see {@link buttonVariants} for available variants
 */
export type ButtonProps = {
	/** Render as child element using Radix Slot */
	asChild?: boolean;
	/** Forwarded ref */
	ref?: React.Ref<HTMLButtonElement>;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

/**
 * A versatile button component with multiple variants and sizes.
 *
 * @remarks
 * The Button component is built on top of class-variance-authority for
 * consistent styling and supports the Radix UI Slot pattern for composition.
 *
 * @param props - Button props including variant, size, and standard button attributes
 * @returns A styled button element
 *
 * @example
 * ```tsx
 * // Default button
 * <Button>Click me</Button>
 *
 * // Destructive action
 * <Button variant="destructive">Delete</Button>
 *
 * // Large outline button
 * <Button variant="outline" size="lg">Learn More</Button>
 *
 * // As child (renders as anchor)
 * <Button asChild>
 *   <a href="/page">Link Button</a>
 * </Button>
 * ```
 *
 * @see {@link buttonVariants} for available style variants
 */
function Button({
	className,
	variant,
	size,
	asChild = false,
	ref,
	...props
}: ButtonProps) {
	const Comp = asChild ? SlotPrimitive.Slot : "button";
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...props}
		/>
	);
}
Button.displayName = "Button";

export { Button, buttonVariants };
