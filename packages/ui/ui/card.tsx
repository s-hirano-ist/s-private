import * as React from "react";

import { cn } from "../utils/cn";

/**
 * A container component for grouping related content.
 *
 * @remarks
 * Card provides a visual container with rounded corners, border, and shadow.
 * Use with CardHeader, CardTitle, CardDescription, CardContent, and CardFooter
 * for semantic structure.
 *
 * @param props - Standard div attributes
 * @returns A styled card container
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardDescription>Description text</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content goes here</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 * ```
 *
 * @see {@link CardHeader} for card header section
 * @see {@link CardContent} for card body section
 * @see {@link CardFooter} for card footer section
 */
const Card = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		className={cn(
			"rounded-xl border border-muted bg-primary-foreground text-primary shadow-sm",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
Card.displayName = "Card";

/**
 * Header section of a Card component.
 *
 * @remarks
 * Contains the title and description of the card with proper spacing.
 *
 * @see {@link Card} for the parent container
 * @see {@link CardTitle} for the title element
 * @see {@link CardDescription} for the description element
 */
const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		className={cn("flex flex-col space-y-1.5 p-6", className)}
		ref={ref}
		{...props}
	/>
));
CardHeader.displayName = "CardHeader";

/**
 * Title element for a Card component.
 *
 * @remarks
 * Renders as an h3 heading with bold styling.
 *
 * @see {@link CardHeader} for the parent section
 */
const CardTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		className={cn(
			"bg-clip-text font-bold leading-normal tracking-tight",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
CardTitle.displayName = "CardTitle";

/**
 * Description text for a Card component.
 *
 * @remarks
 * Renders with muted styling for secondary information.
 *
 * @see {@link CardHeader} for the parent section
 */
const CardDescription = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		className={cn("text-muted-foreground text-sm", className)}
		ref={ref}
		{...props}
	/>
));
CardDescription.displayName = "CardDescription";

/**
 * Main content area of a Card component.
 *
 * @remarks
 * Contains the primary content of the card with horizontal padding.
 *
 * @see {@link Card} for the parent container
 */
const CardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div className={cn("p-6 pt-0", className)} ref={ref} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * Footer section of a Card component.
 *
 * @remarks
 * Typically contains actions like buttons.
 * Uses flexbox for horizontal alignment.
 *
 * @see {@link Card} for the parent container
 */
const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		className={cn("flex items-center p-6 pt-0", className)}
		ref={ref}
		{...props}
	/>
));
CardFooter.displayName = "CardFooter";

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
};
