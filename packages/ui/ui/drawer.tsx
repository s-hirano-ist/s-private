"use client";

import type * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "../utils/cn";

/**
 * Root drawer component for slide-in panels.
 *
 * @remarks
 * Built on the vaul library. Provides accessible slide-in panels
 * from any direction (top, bottom, left, right).
 *
 * @example
 * ```tsx
 * <Drawer>
 *   <DrawerTrigger asChild>
 *     <Button>Open Drawer</Button>
 *   </DrawerTrigger>
 *   <DrawerContent>
 *     <DrawerHeader>
 *       <DrawerTitle>Drawer Title</DrawerTitle>
 *       <DrawerDescription>Drawer description.</DrawerDescription>
 *     </DrawerHeader>
 *     <p>Drawer content</p>
 *     <DrawerFooter>
 *       <DrawerClose asChild>
 *         <Button>Close</Button>
 *       </DrawerClose>
 *     </DrawerFooter>
 *   </DrawerContent>
 * </Drawer>
 * ```
 *
 * @see {@link DrawerContent} for the drawer body
 * @see {@link DrawerTrigger} for the trigger button
 */
function Drawer({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
	return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

/**
 * Button or element that opens the drawer.
 *
 * @see {@link Drawer} for parent component
 */
function DrawerTrigger({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
	return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

/**
 * Portal for rendering drawer outside the DOM hierarchy.
 * @internal
 */
function DrawerPortal({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
	return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

/**
 * Button that closes the drawer.
 *
 * @see {@link DrawerFooter} for typical placement
 */
function DrawerClose({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
	return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

/**
 * Semi-transparent overlay behind the drawer.
 *
 * @remarks
 * Automatically included by DrawerContent.
 */
function DrawerOverlay({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
	return (
		<DrawerPrimitive.Overlay
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			data-slot="drawer-overlay"
			{...props}
		/>
	);
}

/**
 * Main content container for the drawer.
 *
 * @remarks
 * Supports all four directions via the vaul direction prop.
 * Includes a drag handle indicator for bottom drawers.
 *
 * @see {@link Drawer} for parent component
 * @see {@link DrawerHeader} for header section
 * @see {@link DrawerFooter} for footer section
 */
function DrawerContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
	return (
		<DrawerPortal data-slot="drawer-portal">
			<DrawerOverlay />
			<DrawerPrimitive.Content
				className={cn(
					"group/drawer-content fixed z-50 flex h-auto flex-col bg-background",
					"data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
					"data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
					"data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
					"data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
					className,
				)}
				data-slot="drawer-content"
				{...props}
			>
				<div className="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
				{children}
			</DrawerPrimitive.Content>
		</DrawerPortal>
	);
}

/**
 * Header section for drawer title and description.
 *
 * @see {@link DrawerTitle} for the title element
 * @see {@link DrawerDescription} for the description element
 */
function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
				className,
			)}
			data-slot="drawer-header"
			{...props}
		/>
	);
}

/**
 * Footer section for drawer actions.
 *
 * @remarks
 * Positioned at the bottom of the drawer.
 * Typically contains buttons for actions.
 */
function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("mt-auto flex flex-col gap-2 p-4", className)}
			data-slot="drawer-footer"
			{...props}
		/>
	);
}

/**
 * Title element for the drawer.
 *
 * @see {@link DrawerHeader} for parent section
 */
function DrawerTitle({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
	return (
		<DrawerPrimitive.Title
			className={cn("font-semibold text-foreground", className)}
			data-slot="drawer-title"
			{...props}
		/>
	);
}

/**
 * Description text for the drawer.
 *
 * @see {@link DrawerHeader} for parent section
 */
function DrawerDescription({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
	return (
		<DrawerPrimitive.Description
			className={cn("text-muted-foreground text-sm", className)}
			data-slot="drawer-description"
			{...props}
		/>
	);
}

export {
	Drawer,
	DrawerPortal,
	DrawerOverlay,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
	DrawerDescription,
};
