"use client";

import type * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn, cnWithState } from "./utils/cn.js";

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
						"sui:z-50 sui:min-w-32 sui:overflow-hidden sui:rounded-md sui:border sui:bg-primary sui:p-1 sui:text-primary-foreground sui:shadow-lg sui:transition-[opacity,transform] sui:duration-200 sui:data-[ending-style]:scale-95 sui:data-[ending-style]:opacity-0 sui:data-[starting-style]:scale-95 sui:data-[starting-style]:opacity-0",
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
						"sui:z-50 sui:max-h-75 sui:min-w-32 sui:scroll-py-1 sui:overflow-auto sui:rounded-md sui:border sui:border-muted sui:bg-background sui:p-1 sui:text-foreground sui:shadow-md sui:transition-[opacity,transform] sui:duration-200 sui:data-[ending-style]:scale-95 sui:data-[ending-style]:opacity-0 sui:data-[starting-style]:scale-95 sui:data-[starting-style]:opacity-0",
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
				"sui:relative sui:flex sui:cursor-default sui:items-center sui:gap-2 sui:rounded-sm sui:px-2 sui:py-1.5 sui:text-sm sui:outline-hidden sui:transition-colors sui:select-none sui:data-disabled:pointer-events-none sui:data-disabled:opacity-50 sui:data-highlighted:bg-primary sui:data-highlighted:text-primary-foreground sui:[&>svg]:size-4 sui:[&>svg]:shrink-0",
				inset && "sui:pl-8",
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
				"sui:px-2 sui:py-1.5 sui:text-sm sui:font-semibold",
				inset && "sui:pl-8",
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
			className={cnWithState(
				className,
				"sui:-mx-1 sui:my-1 sui:h-px sui:bg-muted",
			)}
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
			className={cn(
				"sui:ml-auto sui:text-xs sui:tracking-widest sui:opacity-60",
				className,
			)}
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
