/**
 * Pagination component for navigating through multiple pages.
 *
 * @remarks
 * Based on shadcn/ui Pagination component with Next.js Link integration.
 * Provides accessible page navigation with Previous/Next buttons and page number links.
 *
 * @example
 * ```tsx
 * <Pagination>
 *   <PaginationContent>
 *     <PaginationItem>
 *       <PaginationPrevious href="/page/1" />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="/page/1">1</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="/page/2" isActive>2</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationEllipsis />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationNext href="/page/3" />
 *     </PaginationItem>
 *   </PaginationContent>
 * </Pagination>
 * ```
 *
 * @module
 */
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { cn } from "../utils/cn";
import { type ButtonProps, buttonVariants } from "./button";

/**
 * Container component for pagination controls.
 *
 * @remarks
 * Renders a semantic `<nav>` element with proper ARIA attributes for accessibility.
 *
 * @param props - Standard nav element props with optional className override
 * @returns A navigation container for pagination items
 */
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
	return (
		<nav
			aria-label="pagination"
			className={cn("mx-auto flex w-full justify-center", className)}
			{...props}
		/>
	);
}
Pagination.displayName = "Pagination";

type PaginationContentProps = {
	ref?: React.Ref<HTMLUListElement>;
} & React.ComponentProps<"ul">;

/**
 * Flex container for pagination items.
 *
 * @remarks
 * Renders an unordered list with horizontal flex layout and gap between items.
 *
 * @param props - Standard ul element props with optional className override
 * @returns A list container for pagination items
 */
function PaginationContent({ className, ref, ...props }: PaginationContentProps) {
	return (
		<ul
			className={cn("flex flex-row items-center gap-1", className)}
			ref={ref}
			{...props}
		/>
	);
}
PaginationContent.displayName = "PaginationContent";

type PaginationItemProps = {
	ref?: React.Ref<HTMLLIElement>;
} & React.ComponentProps<"li">;

/**
 * Individual pagination item wrapper.
 *
 * @remarks
 * Wraps each pagination control (link, ellipsis, etc.) in a list item.
 *
 * @param props - Standard li element props with optional className override
 * @returns A list item wrapper for pagination controls
 */
function PaginationItem({ className, ref, ...props }: PaginationItemProps) {
	return <li className={cn("", className)} ref={ref} {...props} />;
}
PaginationItem.displayName = "PaginationItem";

/**
 * Props for the PaginationLink component.
 */
export type PaginationLinkProps = {
	/** Whether this link represents the current page */
	isActive?: boolean;
} & Pick<ButtonProps, "size"> &
	React.ComponentProps<typeof Link>;

/**
 * Link component for individual page numbers.
 *
 * @remarks
 * Uses Next.js Link for client-side navigation with button styling.
 * Active state shows outline variant, inactive shows ghost variant.
 *
 * @param props - Link props including href, isActive, and optional size
 * @returns A styled Next.js Link for page navigation
 */
function PaginationLink({
	className,
	isActive,
	size = "icon",
	...props
}: PaginationLinkProps) {
	return (
		<Link
			aria-current={isActive ? "page" : undefined}
			className={cn(
				buttonVariants({
					variant: isActive ? "outline" : "ghost",
					size,
				}),
				className,
			)}
			{...props}
		/>
	);
}
PaginationLink.displayName = "PaginationLink";

/**
 * Props for the PaginationPrevious component.
 */
export type PaginationPreviousProps = {
	/** Text label for the previous button. Defaults to "Previous". */
	label?: string;
} & React.ComponentProps<typeof PaginationLink>;

/**
 * Previous page navigation link.
 *
 * @remarks
 * Displays a left chevron icon with customizable text.
 * Inherits all PaginationLink props.
 *
 * @param props - PaginationLink props with optional label for i18n support
 * @returns A styled link for navigating to the previous page
 */
function PaginationPrevious({
	className,
	label = "Previous",
	...props
}: PaginationPreviousProps) {
	return (
		<PaginationLink
			aria-label="Go to previous page"
			className={cn("gap-1 pl-2.5", className)}
			size="default"
			{...props}
		>
			<ChevronLeft className="size-4" />
			<span>{label}</span>
		</PaginationLink>
	);
}
PaginationPrevious.displayName = "PaginationPrevious";

/**
 * Props for the PaginationNext component.
 */
export type PaginationNextProps = {
	/** Text label for the next button. Defaults to "Next". */
	label?: string;
} & React.ComponentProps<typeof PaginationLink>;

/**
 * Next page navigation link.
 *
 * @remarks
 * Displays customizable text with a right chevron icon.
 * Inherits all PaginationLink props.
 *
 * @param props - PaginationLink props with optional label for i18n support
 * @returns A styled link for navigating to the next page
 */
function PaginationNext({
	className,
	label = "Next",
	...props
}: PaginationNextProps) {
	return (
		<PaginationLink
			aria-label="Go to next page"
			className={cn("gap-1 pr-2.5", className)}
			size="default"
			{...props}
		>
			<span>{label}</span>
			<ChevronRight className="size-4" />
		</PaginationLink>
	);
}
PaginationNext.displayName = "PaginationNext";

/**
 * Props for the PaginationEllipsis component.
 */
export type PaginationEllipsisProps = {
	/** Screen reader label for the ellipsis. Defaults to "More pages". */
	srLabel?: string;
} & React.ComponentProps<"span">;

/**
 * Ellipsis indicator for skipped page numbers.
 *
 * @remarks
 * Displays a "..." icon to indicate hidden page numbers between visible ones.
 * Hidden from assistive technology with aria-hidden.
 *
 * @param props - Standard span element props with optional srLabel for i18n support
 * @returns A visual indicator for skipped pages
 */
function PaginationEllipsis({
	className,
	srLabel = "More pages",
	...props
}: PaginationEllipsisProps) {
	return (
		<span
			aria-hidden
			className={cn("flex size-9 items-center justify-center", className)}
			{...props}
		>
			<MoreHorizontal className="size-4" />
			<span className="sr-only">{srLabel}</span>
		</span>
	);
}
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
};
