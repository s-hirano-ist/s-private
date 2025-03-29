import { type ButtonProps, buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/tailwindcss";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	DotsHorizontalIcon,
} from "@radix-ui/react-icons";
import { Link } from "next-view-transitions";
import * as React from "react";

function Pagination({ className, ...properties }: React.ComponentProps<"nav">) {
  return <nav
		aria-label="pagination"
		className={cn("mx-auto flex w-full justify-center", className)}
		{...properties}
	/>
}
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
	HTMLUListElement,
	React.ComponentProps<"ul">
>(({ className, ...properties }, reference) => (
	<ul
		className={cn("flex flex-row items-center gap-1", className)}
		ref={reference}
		{...properties}
	/>
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
	HTMLLIElement,
	React.ComponentProps<"li">
>(({ className, ...properties }, reference) => (
	<li className={cn("", className)} ref={reference} {...properties} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProperties = {
	isActive?: boolean;
} & Pick<ButtonProps, "size"> &
	React.ComponentProps<typeof Link>;

function PaginationLink({
	className,
	isActive,
	size = "icon",
	...properties
}: PaginationLinkProperties) {
  return <Link
		aria-current={isActive ? "page" : undefined}
		className={cn(
			buttonVariants({
				variant: isActive ? "outline" : "ghost",
				size,
			}),
			className,
		)}
		{...properties}
	/>
}
PaginationLink.displayName = "PaginationLink";

function PaginationPrevious({
	className,
	...properties
}: React.ComponentProps<typeof PaginationLink>) {
  return <PaginationLink
		aria-label="Go to previous page"
		className={cn("gap-1 pl-2.5", className)}
		size="default"
		{...properties}
	>
		<ChevronLeftIcon className="size-4" />
	</PaginationLink>
}
PaginationPrevious.displayName = "PaginationPrevious";

function PaginationNext({
	className,
	...properties
}: React.ComponentProps<typeof PaginationLink>) {
  return <PaginationLink
		aria-label="Go to next page"
		className={cn("gap-1 pr-2.5", className)}
		size="default"
		{...properties}
	>
		<ChevronRightIcon className="size-4" />
	</PaginationLink>
}
PaginationNext.displayName = "PaginationNext";

function PaginationEllipsis({
	className,
	...properties
}: React.ComponentProps<"span">) {
  return <span
		aria-hidden
		className={cn("flex h-9 w-9 items-center justify-center", className)}
		{...properties}
	>
		<DotsHorizontalIcon className="size-4" />
		<span className="sr-only">More pages</span>
	</span>
}
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
	Pagination,
	PaginationContent,
	PaginationLink,
	PaginationItem,
	PaginationPrevious,
	PaginationNext,
	PaginationEllipsis,
};
