"use client";

import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "../utils/cn";
import { Button } from "./button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./dialog";

/**
 * Root command palette component.
 *
 * @remarks
 * Built on the cmdk library. Provides a searchable command menu
 * with keyboard navigation. Use with CommandInput, CommandList,
 * CommandGroup, and CommandItem for a complete command palette.
 *
 * @param props - cmdk Command props
 * @returns A command palette container
 *
 * @example
 * ```tsx
 * <Command>
 *   <CommandInput placeholder="Search..." />
 *   <CommandList>
 *     <CommandGroup heading="Actions">
 *       <CommandItem>Action 1</CommandItem>
 *       <CommandItem>Action 2</CommandItem>
 *     </CommandGroup>
 *   </CommandList>
 * </Command>
 * ```
 *
 * @see {@link CommandDialog} for modal variant
 * @see {@link CommandInput} for search input
 * @see {@link CommandList} for scrollable list
 */
function Command({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			className={cn(
				"flex h-full w-full flex-col overflow-hidden rounded-md bg-background text-foreground",
				className,
			)}
			data-slot="command"
			{...props}
		/>
	);
}

/**
 * Command palette displayed in a modal dialog.
 *
 * @remarks
 * Combines Command with Dialog for a modal command palette experience.
 * Includes accessible title and description for screen readers.
 *
 * @param props - Dialog props plus title, description, and layout options
 * @returns A modal command palette
 *
 * @example
 * ```tsx
 * <CommandDialog open={open} onOpenChange={setOpen}>
 *   <CommandInput placeholder="Type a command..." />
 *   <CommandList>
 *     <CommandEmpty>No results found.</CommandEmpty>
 *     <CommandGroup heading="Commands">
 *       <CommandItem>Profile</CommandItem>
 *       <CommandItem>Settings</CommandItem>
 *     </CommandGroup>
 *   </CommandList>
 * </CommandDialog>
 * ```
 *
 * @see {@link Command} for non-modal variant
 */
function CommandDialog({
	title = "Command Palette",
	description = "Search for a command to run...",
	children,
	className,
	showCloseButton = true,
	size,
	...props
}: React.ComponentProps<typeof Dialog> & {
	title?: string;
	description?: string;
	className?: string;
	showCloseButton?: boolean;
	size?: "default" | "md" | "lg";
}) {
	return (
		<Dialog {...props}>
			<DialogHeader className="sr-only">
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>
			<DialogContent
				className={cn("overflow-hidden p-0", className)}
				size={size}
			>
				<Command className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
					{children}
				</Command>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Search input for the command palette.
 *
 * @remarks
 * Filters command items as the user types.
 * Optionally includes a search button for explicit search trigger.
 *
 * @param props - cmdk Input props plus optional onSearchClick handler
 * @returns A styled search input
 *
 * @see {@link Command} for parent component
 */
function CommandInput({
	className,
	onSearchClick,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
	onSearchClick?: () => Promise<void>;
}) {
	return (
		<div
			className="flex h-9 items-center px-4"
			data-slot="command-input-wrapper"
		>
			<CommandPrimitive.Input
				className={cn(
					"flex h-10 w-full rounded-md bg-transparent py-3 text-base outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				data-slot="command-input"
				{...props}
			/>
			{onSearchClick && (
				<Button className="shrink-0" onClick={onSearchClick}>
					<SearchIcon className="size-4" />
				</Button>
			)}
		</div>
	);
}

/**
 * Scrollable list container for command items.
 *
 * @remarks
 * Contains CommandGroup and CommandItem components.
 * Fixed height with overflow scrolling.
 *
 * @see {@link CommandGroup} for grouping items
 * @see {@link CommandItem} for individual items
 */
function CommandList({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
	return (
		<CommandPrimitive.List
			className={cn(
				"h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden",
				className,
			)}
			data-slot="command-list"
			{...props}
		/>
	);
}

/**
 * Empty state displayed when no command items match.
 *
 * @remarks
 * Shown automatically when the filter returns no results.
 *
 * @see {@link CommandList} for parent component
 */
function CommandEmpty({
	...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return (
		<CommandPrimitive.Empty
			className="py-6 text-center text-sm"
			data-slot="command-empty"
			{...props}
		/>
	);
}

/**
 * Group container for related command items.
 *
 * @remarks
 * Use the heading prop to label the group.
 *
 * @see {@link CommandList} for parent component
 * @see {@link CommandItem} for items within the group
 */
function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
	return (
		<CommandPrimitive.Group
			className={cn(
				"overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs",
				className,
			)}
			data-slot="command-group"
			{...props}
		/>
	);
}

/**
 * Individual selectable item in the command palette.
 *
 * @remarks
 * Supports keyboard navigation and selection.
 * Shows selected state with background highlight.
 *
 * @see {@link CommandGroup} for grouping items
 */
function CommandItem({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			className={cn(
				"relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-[selected=true]:bg-muted data-[selected=true]:text-foreground data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			data-slot="command-item"
			{...props}
		/>
	);
}

/**
 * Keyboard shortcut hint displayed in a command item.
 *
 * @remarks
 * Positioned at the end of the command item with muted styling.
 *
 * @example
 * ```tsx
 * <CommandItem>
 *   Save
 *   <CommandShortcut>⌘S</CommandShortcut>
 * </CommandItem>
 * ```
 */
function CommandShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			className={cn(
				"ml-auto text-muted-foreground text-xs tracking-widest",
				className,
			)}
			data-slot="command-shortcut"
			{...props}
		/>
	);
}

export {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandShortcut,
};
