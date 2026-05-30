import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "../utils/cn";

/**
 * Button style variants using tailwind-variants.
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
const buttonVariants = tv({
	base: "inline-flex items-center justify-center rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-hidden active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
	variants: {
		variant: {
			default:
				"bg-linear-to-r from-primary to-primary-grad text-white shadow-[0_2px_16px_rgb(var(--primary)/0.3)] hover:shadow-[0_4px_24px_rgb(var(--primary)/0.45)] hover:brightness-110",
			destructive:
				"bg-destructive text-white shadow-[0_2px_16px_rgb(var(--destructive)/0.3)] hover:shadow-[0_4px_24px_rgb(var(--destructive)/0.45)] hover:brightness-110",
			outline:
				"border border-foreground/10 bg-background/60 shadow-xs backdrop-blur-sm hover:border-primary/30 hover:bg-background/90 hover:shadow-md",
			secondary:
				"bg-muted/60 text-muted-foreground shadow-xs backdrop-blur-sm hover:bg-muted/80",
			ghost: "hover:bg-primary/5 hover:text-primary",
			link: "text-white underline-offset-4 hover:underline",
			navSide: "rounded-full transition-all duration-200 hover:bg-primary/10",
			navCenter:
				"rounded-full bg-linear-to-br from-primary to-primary-grad text-white shadow-[0_4px_20px_rgb(var(--primary)/0.4)] ring-4 ring-background transition-all duration-200 hover:scale-110 hover:shadow-[0_6px_28px_rgb(var(--primary)/0.5)] active:scale-95",
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
});

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
 * The Button component is built on top of tailwind-variants for
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
	const Comp = asChild ? Slot : "button";
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
