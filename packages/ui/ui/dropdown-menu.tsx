"use client";

import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "../utils/cn";

/**
 * Root dropdown menu component.
 *
 * @remarks
 * Built on Radix UI DropdownMenu primitive. Provides accessible
 * dropdown menus with keyboard navigation.
 *
 * @example
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenuTrigger asChild>
 *     <Button>Open Menu</Button>
 *   </DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuLabel>My Account</DropdownMenuLabel>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem>Profile</DropdownMenuItem>
 *     <DropdownMenuItem>Settings</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 *
 * @see {@link DropdownMenuContent} for the menu body
 * @see {@link DropdownMenuTrigger} for the trigger button
 */
const DropdownMenu = DropdownMenuPrimitive.Root;

/**
 * Button or element that opens the dropdown menu.
 *
 * @see {@link DropdownMenu} for parent component
 */
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/**
 * Group container for related menu items.
 *
 * @see {@link DropdownMenuItem} for items within the group
 */
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

/**
 * Portal for rendering menu outside the DOM hierarchy.
 * @internal
 */
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

/**
 * Root for nested submenu.
 *
 * @see {@link DropdownMenuSubContent} for submenu content
 */
const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/**
 * Group for radio-style menu items.
 */
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

type DropdownMenuSubContentProps = {
	ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>>;
} & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>;

/**
 * Content container for nested submenu.
 *
 * @see {@link DropdownMenuSub} for parent component
 */
function DropdownMenuSubContent({
	className,
	ref,
	...props
}: DropdownMenuSubContentProps) {
	return (
		<DropdownMenuPrimitive.SubContent
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-primary p-1 text-primary-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
DropdownMenuSubContent.displayName =
	DropdownMenuPrimitive.SubContent.displayName;

type DropdownMenuContentProps = {
	ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.Content>>;
} & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>;

/**
 * Main content container for the dropdown menu.
 *
 * @remarks
 * Contains menu items with proper animations and positioning.
 *
 * @see {@link DropdownMenu} for parent component
 * @see {@link DropdownMenuItem} for menu items
 */
function DropdownMenuContent({
	className,
	sideOffset = 4,
	ref,
	...props
}: DropdownMenuContentProps) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				className={cn(
					"z-50 max-h-[300px] min-w-[8rem] scroll-py-1 overflow-auto rounded-md border border-muted bg-background p-1 text-foreground shadow-md",
					"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=open]:animate-in",
					className,
				)}
				ref={ref}
				sideOffset={sideOffset}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

type DropdownMenuItemProps = {
	ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.Item>>;
	inset?: boolean;
} & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>;

/**
 * Individual selectable item in the dropdown menu.
 *
 * @remarks
 * Supports keyboard navigation and focus states.
 *
 * @see {@link DropdownMenuContent} for parent component
 */
function DropdownMenuItem({
	className,
	inset,
	ref,
	...props
}: DropdownMenuItemProps) {
	return (
		<DropdownMenuPrimitive.Item
			className={cn(
				"relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors focus:bg-primary focus:text-primary-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
				inset && "pl-8",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

type DropdownMenuLabelProps = {
	ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.Label>>;
	inset?: boolean;
} & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>;

/**
 * Non-interactive label for a menu section.
 *
 * @see {@link DropdownMenuContent} for parent component
 */
function DropdownMenuLabel({
	className,
	inset,
	ref,
	...props
}: DropdownMenuLabelProps) {
	return (
		<DropdownMenuPrimitive.Label
			className={cn(
				"px-2 py-1.5 font-semibold text-sm",
				inset && "pl-8",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

type DropdownMenuSeparatorProps = {
	ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.Separator>>;
} & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>;

/**
 * Visual separator between menu sections.
 */
function DropdownMenuSeparator({
	className,
	ref,
	...props
}: DropdownMenuSeparatorProps) {
	return (
		<DropdownMenuPrimitive.Separator
			className={cn("-mx-1 my-1 h-px bg-muted", className)}
			ref={ref}
			{...props}
		/>
	);
}
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

/**
 * Keyboard shortcut hint for a menu item.
 *
 * @example
 * ```tsx
 * <DropdownMenuItem>
 *   Save
 *   <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
 * </DropdownMenuItem>
 * ```
 */
function DropdownMenuShortcut({
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
			{...props}
		/>
	);
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuRadioGroup,
};
