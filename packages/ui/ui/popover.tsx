"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type * as React from "react";
import { cn } from "../utils/cn";

/**
 * Root popover component for floating content.
 *
 * @remarks
 * Built on Radix UI Popover primitive. Provides accessible
 * floating panels with proper positioning and focus management.
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger asChild>
 *     <Button>Open Popover</Button>
 *   </PopoverTrigger>
 *   <PopoverContent>
 *     <p>Popover content here</p>
 *   </PopoverContent>
 * </Popover>
 * ```
 *
 * @see {@link PopoverContent} for the popover body
 * @see {@link PopoverTrigger} for the trigger button
 */
const Popover = PopoverPrimitive.Root;

/**
 * Button or element that opens the popover.
 *
 * @see {@link Popover} for parent component
 */
const PopoverTrigger = PopoverPrimitive.Trigger;

/**
 * Anchor element for custom popover positioning.
 *
 * @remarks
 * Use when the trigger and anchor should be different elements.
 */
const PopoverAnchor = PopoverPrimitive.Anchor;

type PopoverContentProps = {
	ref?: React.Ref<React.ComponentRef<typeof PopoverPrimitive.Content>>;
} & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;

/**
 * Content container for the popover.
 *
 * @remarks
 * Includes animations and proper positioning.
 * Default alignment is center with 4px offset.
 *
 * @see {@link Popover} for parent component
 */
function PopoverContent({
	className,
	align = "center",
	sideOffset = 4,
	ref,
	...props
}: PopoverContentProps) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				align={align}
				className={cn(
					"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border bg-background p-4 text-foreground shadow-md outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in",
					className,
				)}
				ref={ref}
				sideOffset={sideOffset}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
