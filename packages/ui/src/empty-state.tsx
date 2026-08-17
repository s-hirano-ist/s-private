import type * as React from "react";
import { cn } from "./utils/cn";

function EmptyState({ className, ...props }: React.ComponentProps<"section">) {
	return (
		<section
			className={cn(
				"sui:flex sui:animate-[sui-enter_300ms_ease-out_both] sui:flex-col sui:items-center sui:gap-3 sui:py-12 sui:text-center",
				className,
			)}
			data-slot="empty-state"
			{...props}
		/>
	);
}

function EmptyStateIcon({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"sui:rounded-full sui:bg-primary/10 sui:p-4 sui:text-primary",
				className,
			)}
			data-slot="empty-state-icon"
			{...props}
		/>
	);
}

function EmptyStateTitle({
	children,
	className,
	...props
}: React.ComponentProps<"h2">) {
	return (
		<h2
			className={cn("sui:text-2xl sui:font-bold sui:tracking-tight", className)}
			data-slot="empty-state-title"
			{...props}
		>
			{children}
		</h2>
	);
}

function EmptyStateDescription({
	className,
	...props
}: React.ComponentProps<"p">) {
	return (
		<p
			className={cn(
				"sui:max-w-prose sui:text-base sui:text-muted-foreground",
				className,
			)}
			data-slot="empty-state-description"
			{...props}
		/>
	);
}

function EmptyStateActions({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"sui:mt-2 sui:flex sui:flex-wrap sui:justify-center sui:gap-2",
				className,
			)}
			data-slot="empty-state-actions"
			{...props}
		/>
	);
}

export {
	EmptyState,
	EmptyStateActions,
	EmptyStateDescription,
	EmptyStateIcon,
	EmptyStateTitle,
};
