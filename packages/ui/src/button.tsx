import type * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "./utils/cn.js";

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
 *
 * @example
 * ```typescript
 * const className = buttonVariants({ variant: "outline", size: "lg" });
 * ```
 */
const buttonVariants = tv({
	base: "sui:inline-flex sui:items-center sui:justify-center sui:rounded-md sui:text-sm sui:font-medium sui:whitespace-nowrap sui:transition-all sui:duration-200 sui:focus-visible:ring-1 sui:focus-visible:ring-primary sui:focus-visible:outline-hidden sui:active:scale-[0.97] sui:disabled:pointer-events-none sui:disabled:opacity-50",
	variants: {
		variant: {
			default:
				"sui:bg-linear-to-r sui:from-primary sui:to-primary-grad sui:text-white sui:shadow-[0_2px_16px_rgb(var(--sui-primary)/0.3)] sui:hover:shadow-[0_4px_24px_rgb(var(--sui-primary)/0.45)] sui:hover:brightness-110",
			destructive:
				"sui:bg-destructive sui:text-white sui:shadow-[0_2px_16px_rgb(var(--sui-destructive)/0.3)] sui:hover:shadow-[0_4px_24px_rgb(var(--sui-destructive)/0.45)] sui:hover:brightness-110",
			outline:
				"sui:border sui:border-foreground/10 sui:bg-background/60 sui:shadow-xs sui:backdrop-blur-sm sui:hover:border-primary/30 sui:hover:bg-background/90 sui:hover:shadow-md",
			secondary:
				"sui:bg-muted/60 sui:text-muted-foreground sui:shadow-xs sui:backdrop-blur-sm sui:hover:bg-muted/80",
			ghost: "sui:hover:bg-primary/5 sui:hover:text-primary",
			link: "sui:text-foreground sui:underline-offset-4 sui:hover:text-primary sui:hover:underline",
		},
		size: {
			default: "sui:h-9 sui:px-4 sui:py-2",
			sm: "sui:h-8 sui:rounded-md sui:px-3 sui:text-xs",
			lg: "sui:h-10 sui:rounded-md sui:px-8",
			icon: "sui:size-9",
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
	className?: string;
} & Omit<React.ComponentProps<typeof ButtonPrimitive>, "className"> &
	VariantProps<typeof buttonVariants>;

/**
 * A versatile button component with multiple variants and sizes.
 *
 * @remarks
 * The Button component is built on top of tailwind-variants for
 * consistent styling and supports Base UI's render prop for composition.
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
 * // Compose with another button component
 * <Button render={<CustomButton />}>Click me</Button>
 * ```
 *
 * @see {@link buttonVariants} for available style variants
 */
function Button({ className, variant, size, ...props }: ButtonProps) {
	return (
		<ButtonPrimitive
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
