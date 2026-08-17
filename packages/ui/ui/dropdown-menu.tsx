"use client";

import type * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn, cnWithState } from "../utils/cn";

const DropdownMenu = MenuPrimitive.Root;
const DropdownMenuTrigger = MenuPrimitive.Trigger;
const DropdownMenuGroup = MenuPrimitive.Group;
const DropdownMenuPortal = MenuPrimitive.Portal;
const DropdownMenuSub = MenuPrimitive.SubmenuRoot;
const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;

type PositionerProps = React.ComponentProps<typeof MenuPrimitive.Positioner>;

type DropdownMenuSubContentProps = {
	positionerProps?: PositionerProps;
} & React.ComponentProps<typeof MenuPrimitive.Popup>;

function DropdownMenuSubContent({
	className,
	positionerProps,
	...props
}: DropdownMenuSubContentProps) {
	return (
		<MenuPrimitive.Portal>
			<MenuPrimitive.Positioner
				align="start"
				alignOffset={-4}
				side="right"
				sideOffset={-4}
				{...positionerProps}
			>
				<MenuPrimitive.Popup
					className={cnWithState(
						className,
						"z-50 min-w-32 overflow-hidden rounded-md border bg-primary p-1 text-primary-foreground shadow-lg transition-[opacity,transform] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
					)}
					data-slot="dropdown-menu-sub-content"
					{...props}
				/>
			</MenuPrimitive.Positioner>
		</MenuPrimitive.Portal>
	);
}

type DropdownMenuContentProps = {
	positionerProps?: PositionerProps;
} & React.ComponentProps<typeof MenuPrimitive.Popup>;

function DropdownMenuContent({
	className,
	positionerProps,
	...props
}: DropdownMenuContentProps) {
	return (
		<MenuPrimitive.Portal>
			<MenuPrimitive.Positioner sideOffset={4} {...positionerProps}>
				<MenuPrimitive.Popup
					className={cnWithState(
						className,
						"z-50 max-h-75 min-w-32 scroll-py-1 overflow-auto rounded-md border border-muted bg-background p-1 text-foreground shadow-md transition-[opacity,transform] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
					)}
					data-slot="dropdown-menu-content"
					{...props}
				/>
			</MenuPrimitive.Positioner>
		</MenuPrimitive.Portal>
	);
}

type DropdownMenuItemProps = {
	inset?: boolean;
} & React.ComponentProps<typeof MenuPrimitive.Item>;

function DropdownMenuItem({
	className,
	inset,
	...props
}: DropdownMenuItemProps) {
	return (
		<MenuPrimitive.Item
			className={cnWithState(
				className,
				"relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-primary data-highlighted:text-primary-foreground [&>svg]:size-4 [&>svg]:shrink-0",
				inset && "pl-8",
			)}
			data-slot="dropdown-menu-item"
			{...props}
		/>
	);
}

type DropdownMenuLabelProps = {
	inset?: boolean;
} & React.ComponentProps<typeof MenuPrimitive.GroupLabel>;

function DropdownMenuLabel({
	className,
	inset,
	...props
}: DropdownMenuLabelProps) {
	return (
		<MenuPrimitive.GroupLabel
			className={cnWithState(
				className,
				"px-2 py-1.5 text-sm font-semibold",
				inset && "pl-8",
			)}
			data-slot="dropdown-menu-label"
			{...props}
		/>
	);
}

function DropdownMenuSeparator({
	className,
	...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
	return (
		<MenuPrimitive.Separator
			className={cnWithState(className, "-mx-1 my-1 h-px bg-muted")}
			data-slot="dropdown-menu-separator"
			{...props}
		/>
	);
}

function DropdownMenuShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
			data-slot="dropdown-menu-shortcut"
			{...props}
		/>
	);
}

export {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuTrigger,
};
