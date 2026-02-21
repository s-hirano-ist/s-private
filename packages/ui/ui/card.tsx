import type * as React from "react";

import { cn } from "../utils/cn";

type CardProps = {
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>;

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
function Card({ className, ref, ...props }: CardProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-muted bg-primary-foreground text-primary shadow-sm transition-all duration-200 ease-out",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
Card.displayName = "Card";

type CardHeaderProps = {
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>;

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
function CardHeader({ className, ref, ...props }: CardHeaderProps) {
	return (
		<div
			className={cn("flex flex-col space-y-1 p-4", className)}
			ref={ref}
			{...props}
		/>
	);
}
CardHeader.displayName = "CardHeader";

type CardTitleProps = {
	ref?: React.Ref<HTMLHeadingElement>;
} & React.HTMLAttributes<HTMLHeadingElement>;

/**
 * Title element for a Card component.
 *
 * @remarks
 * Renders as an h3 heading with bold styling.
 *
 * @see {@link CardHeader} for the parent section
 */
function CardTitle({ className, ref, ...props }: CardTitleProps) {
	return (
		<h3
			className={cn(
				"bg-clip-text font-bold leading-normal tracking-tight",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
CardTitle.displayName = "CardTitle";

type CardDescriptionProps = {
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Description text for a Card component.
 *
 * @remarks
 * Renders with muted styling for secondary information.
 *
 * @see {@link CardHeader} for the parent section
 */
function CardDescription({ className, ref, ...props }: CardDescriptionProps) {
	return (
		<div
			className={cn("text-muted-foreground text-sm", className)}
			ref={ref}
			{...props}
		/>
	);
}
CardDescription.displayName = "CardDescription";

type CardContentProps = {
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Main content area of a Card component.
 *
 * @remarks
 * Contains the primary content of the card with horizontal padding.
 *
 * @see {@link Card} for the parent container
 */
function CardContent({ className, ref, ...props }: CardContentProps) {
	return <div className={cn("p-4 pt-0", className)} ref={ref} {...props} />;
}
CardContent.displayName = "CardContent";

type CardFooterProps = {
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Footer section of a Card component.
 *
 * @remarks
 * Typically contains actions like buttons.
 * Uses flexbox for horizontal alignment.
 *
 * @see {@link Card} for the parent container
 */
function CardFooter({ className, ref, ...props }: CardFooterProps) {
	return (
		<div
			className={cn("flex items-center p-4 pt-0", className)}
			ref={ref}
			{...props}
		/>
	);
}
CardFooter.displayName = "CardFooter";

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
};
