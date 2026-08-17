import type * as React from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left.mjs";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.mjs";
import MoreHorizontal from "lucide-react/dist/esm/icons/ellipsis.mjs";
import { type ButtonProps, buttonVariants } from "./button";
import { cn } from "./utils/cn";

/**
 * Pagination component for navigating through multiple pages.
 *
 * @remarks
 * Router-agnostic pagination component.
 *
 * Pagination links render as standard `<a>` elements by default.
 * Framework-specific link components, such as Custom router `Link`,
 * can be provided via the `as` prop.
 *
 * @example Standard anchor
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
 *       <PaginationLink href="/page/2" isActive>
 *         2
 *       </PaginationLink>
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
 * @example Custom router
 * ```tsx
 * const RouterLink = MyRouterLink;
 *
 * <Pagination>
 *   <PaginationContent>
 *     <PaginationItem>
 *       <PaginationPrevious as={RouterLink} href="/page/1" />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink as={RouterLink} href="/page/2" isActive>
 *         2
 *       </PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationNext as={RouterLink} href="/page/3" />
 *     </PaginationItem>
 *   </PaginationContent>
 * </Pagination>
 * ```
 *
 * @module
 */

/**
 * Props for a polymorphic component.
 *
 * Allows the rendered element or component to be changed with the `as` prop
 * while preserving the props supported by that element or component.
 */
type PolymorphicProps<
	C extends React.ElementType,
	Props extends object = object,
> = Props & {
	as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof Props | "as">;

/**
 * Container component for pagination controls.
 *
 * @remarks
 * Renders a semantic `<nav>` element with proper ARIA attributes for
 * accessibility.
 *
 * @param props - Standard nav element props with optional className override
 * @returns A navigation container for pagination items
 */
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
	return (
		<nav
			aria-label="pagination"
			className={cn(
				"sui:mx-auto sui:flex sui:w-full sui:justify-center",
				className,
			)}
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
 * @returns A list container for pagination controls
 */
function PaginationContent({
	className,
	ref,
	...props
}: PaginationContentProps) {
	return (
		<ul
			className={cn(
				"sui:flex sui:flex-row sui:items-center sui:gap-1",
				className,
			)}
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
 * Props owned by PaginationLink regardless of which element or component
 * is rendered.
 */
type PaginationLinkOwnProps = {
	/** Additional class names. */
	className?: string;

	/** Whether this link represents the current page. */
	isActive?: boolean;

	/** Button size used for styling. */
	size?: ButtonProps["size"];
};

/**
 * Props for the PaginationLink component.
 *
 * @remarks
 * Renders an `<a>` element by default.
 *
 * Use the `as` prop to integrate with framework-specific routing components,
 * such as Custom router `Link`.
 */
export type PaginationLinkProps<C extends React.ElementType = "a"> =
	PolymorphicProps<C, PaginationLinkOwnProps>;

/**
 * Builds the common class name used by pagination links.
 */
function getPaginationLinkClassName({
	className,
	isActive,
	size,
}: {
	className?: string;
	isActive?: boolean;
	size: ButtonProps["size"];
}) {
	return cn(
		buttonVariants({
			variant: isActive ? "outline" : "ghost",
			size,
		}),
		className,
	);
}

/**
 * Link component for individual page numbers.
 *
 * @remarks
 * Uses a standard `<a>` element by default.
 *
 * Framework-specific link components can be supplied using `as`.
 *
 * @example Standard anchor
 * ```tsx
 * <PaginationLink href="/page/2">
 *   2
 * </PaginationLink>
 * ```
 *
 * @example Custom router
 * ```tsx
 * const RouterLink = MyRouterLink;
 *
 * <PaginationLink as={RouterLink} href="/page/2">
 *   2
 * </PaginationLink>
 * ```
 *
 * @param props - Link props including href, isActive, size, and optional as
 * @returns A styled pagination link
 */
function PaginationLink<C extends React.ElementType = "a">({
	as,
	className,
	isActive,
	size = "icon",
	...props
}: PaginationLinkProps<C>) {
	const Component = as ?? "a";

	return (
		<Component
			aria-current={isActive ? "page" : undefined}
			className={getPaginationLinkClassName({
				className,
				isActive,
				size,
			})}
			{...props}
		/>
	);
}

PaginationLink.displayName = "PaginationLink";

/**
 * Props owned by PaginationPrevious regardless of which element or component
 * is rendered.
 */
type PaginationPreviousOwnProps = {
	/** Additional class names. */
	className?: string;

	/** Whether this link represents the current page. */
	isActive?: boolean;

	/** Text label for the previous button. Defaults to "Previous". */
	label?: string;

	/** Button size used for styling. Defaults to "default". */
	size?: ButtonProps["size"];
};

/**
 * Props for the PaginationPrevious component.
 *
 * @remarks
 * Renders an `<a>` element by default.
 *
 * Use the `as` prop for framework-specific routing components.
 */
export type PaginationPreviousProps<C extends React.ElementType = "a"> =
	PolymorphicProps<C, PaginationPreviousOwnProps>;

/**
 * Previous page navigation link.
 *
 * @remarks
 * Displays a left chevron icon with customizable text.
 *
 * This component renders the polymorphic element directly rather than
 * composing another generic polymorphic component.
 *
 * @example Standard anchor
 * ```tsx
 * <PaginationPrevious href="/page/1" />
 * ```
 *
 * @example Custom router
 * ```tsx
 * const RouterLink = MyRouterLink;
 *
 * <PaginationPrevious as={RouterLink} href="/page/1" />
 * ```
 *
 * @param props - Link props with optional label
 * @returns A styled link for navigating to the previous page
 */
function PaginationPrevious<C extends React.ElementType = "a">({
	as,
	className,
	isActive,
	label = "Previous",
	size = "default",
	...props
}: PaginationPreviousProps<C>) {
	const Component = as ?? "a";

	return (
		<Component
			aria-current={isActive ? "page" : undefined}
			aria-label="Go to previous page"
			className={getPaginationLinkClassName({
				className: cn("sui:gap-1 sui:pl-2.5", className),
				isActive,
				size,
			})}
			{...props}
		>
			<ChevronLeft aria-hidden="true" className="sui:size-4" />
			<span>{label}</span>
		</Component>
	);
}

PaginationPrevious.displayName = "PaginationPrevious";

/**
 * Props owned by PaginationNext regardless of which element or component
 * is rendered.
 */
type PaginationNextOwnProps = {
	/** Additional class names. */
	className?: string;

	/** Whether this link represents the current page. */
	isActive?: boolean;

	/** Text label for the next button. Defaults to "Next". */
	label?: string;

	/** Button size used for styling. Defaults to "default". */
	size?: ButtonProps["size"];
};

/**
 * Props for the PaginationNext component.
 *
 * @remarks
 * Renders an `<a>` element by default.
 *
 * Use the `as` prop for framework-specific routing components.
 */
export type PaginationNextProps<C extends React.ElementType = "a"> =
	PolymorphicProps<C, PaginationNextOwnProps>;

/**
 * Next page navigation link.
 *
 * @remarks
 * Displays customizable text with a right chevron icon.
 *
 * This component renders the polymorphic element directly rather than
 * composing another generic polymorphic component.
 *
 * @example Standard anchor
 * ```tsx
 * <PaginationNext href="/page/3" />
 * ```
 *
 * @example Custom router
 * ```tsx
 * const RouterLink = MyRouterLink;
 *
 * <PaginationNext as={RouterLink} href="/page/3" />
 * ```
 *
 * @param props - Link props with optional label
 * @returns A styled link for navigating to the next page
 */
function PaginationNext<C extends React.ElementType = "a">({
	as,
	className,
	isActive,
	label = "Next",
	size = "default",
	...props
}: PaginationNextProps<C>) {
	const Component = as ?? "a";

	return (
		<Component
			aria-current={isActive ? "page" : undefined}
			aria-label="Go to next page"
			className={getPaginationLinkClassName({
				className: cn("sui:gap-1 sui:pr-2.5", className),
				isActive,
				size,
			})}
			{...props}
		>
			<span>{label}</span>
			<ChevronRight aria-hidden="true" className="sui:size-4" />
		</Component>
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
 *
 * The icon itself is hidden from assistive technology, while the provided
 * screen-reader label remains accessible.
 *
 * @param props - Standard span element props with optional srLabel for i18n
 * @returns A visual indicator for skipped pages
 */
function PaginationEllipsis({
	className,
	srLabel = "More pages",
	...props
}: PaginationEllipsisProps) {
	return (
		<span
			className={cn(
				"sui:flex sui:size-9 sui:items-center sui:justify-center",
				className,
			)}
			{...props}
		>
			<MoreHorizontal aria-hidden="true" className="sui:size-4" />
			<span className="sui:sr-only">{srLabel}</span>
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
