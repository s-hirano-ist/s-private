"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/utils/tailwindcss";

function Drawer({
	shouldScaleBackground = true,
	disablePreventScroll = false,
	handleOnly = true,
	dismissible = true,
	...properties
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
	return (
		<DrawerPrimitive.Root
			direction="bottom"
			disablePreventScroll={disablePreventScroll}
			dismissible={dismissible}
			handleOnly={handleOnly}
			shouldScaleBackground={shouldScaleBackground}
			{...properties}
		/>
	);
}
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...properties }, reference) => (
	<DrawerPrimitive.Overlay
		className={cn("fixed inset-0 z-50 bg-black/80", className)}
		ref={reference}
		{...properties}
	/>
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...properties }, reference) => (
	<DrawerPortal>
		<DrawerOverlay />
		<DrawerPrimitive.Content
			className={cn(
				"fixed inset-x-0 bottom-0 z-50 flex h-full flex-col rounded-t-[10px] border bg-background",
				className,
			)}
			ref={reference}
			{...properties}
		>
			{children}
		</DrawerPrimitive.Content>
	</DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

function DrawerHeader({
	className,
	...properties
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
			{...properties}
		/>
	);
}
DrawerHeader.displayName = "DrawerHeader";

function DrawerFooter({
	className,
	...properties
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("mt-auto flex flex-col gap-2 p-4", className)}
			{...properties}
		/>
	);
}
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...properties }, reference) => (
	<DrawerPrimitive.Title
		className={cn(
			"text-lg font-semibold leading-none tracking-tight",
			className,
		)}
		ref={reference}
		{...properties}
	/>
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...properties }, reference) => (
	<DrawerPrimitive.Description
		className={cn("text-sm text-muted-foreground", className)}
		ref={reference}
		{...properties}
	/>
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

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
