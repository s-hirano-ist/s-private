"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import * as React from "react";
import { cn, cnWithState } from "../utils/cn";

/**
 * Root drawer component for slide-in panels.
 *
 * @remarks
 * Built on the Base UI DrawerPreview. Provides accessible slide-in panels
 * with swipe-to-dismiss support.
 *
 * @example
 * ```tsx
 * <Drawer>
 *   <DrawerTrigger render={<Button />}>
 *     Open Drawer
 *   </DrawerTrigger>
 *   <DrawerContent>
 *     <DrawerHeader>
 *       <DrawerTitle>Drawer Title</DrawerTitle>
 *       <DrawerDescription>Drawer description.</DrawerDescription>
 *     </DrawerHeader>
 *     <p>Drawer content</p>
 *     <DrawerFooter>
 *       <DrawerClose render={<Button />}>Close</DrawerClose>
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
 * @remarks
 * Supports Base UI's `render` prop to compose a custom element.
 *
 * @see {@link Drawer} for parent component
 */
function DrawerTrigger(
	props: React.ComponentProps<typeof DrawerPrimitive.Trigger>,
) {
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
 * @remarks
 * Supports Base UI's `render` prop to compose a custom element.
 *
 * @see {@link DrawerFooter} for typical placement
 */
function DrawerClose(
	props: React.ComponentProps<typeof DrawerPrimitive.Close>,
) {
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
}: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
	return (
		<DrawerPrimitive.Backdrop
			className={cnWithState(
				className,
				"fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
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
 * Renders as a bottom sheet with swipe-to-dismiss.
 * Includes a drag handle indicator.
 *
 * @see {@link Drawer} for parent component
 * @see {@link DrawerHeader} for header section
 * @see {@link DrawerFooter} for footer section
 */
function DrawerContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Popup>) {
	return (
		<DrawerPortal>
			<DrawerOverlay />
			<DrawerPrimitive.Viewport data-slot="drawer-viewport">
				<DrawerPrimitive.Popup
					className={cnWithState(
						className,
						"group/drawer-content fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[80vh] flex-col rounded-t-lg border-t bg-background",
						"transition-transform duration-300 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
					)}
					data-slot="drawer-content"
					{...props}
				>
					<div className="mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-muted" />
					{children}
				</DrawerPrimitive.Popup>
			</DrawerPrimitive.Viewport>
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
				"flex flex-col gap-0.5 p-4 text-center md:gap-1.5 md:text-left",
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
			className={cnWithState(className, "font-semibold text-foreground")}
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
			className={cnWithState(className, "text-sm text-muted-foreground")}
			data-slot="drawer-description"
			{...props}
		/>
	);
}

export {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	DrawerPortal,
	DrawerTitle,
	DrawerTrigger,
};
