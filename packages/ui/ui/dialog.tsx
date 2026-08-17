"use client";

import type * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { tv, type VariantProps } from "tailwind-variants";
import { cn, cnWithState } from "../utils/cn";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;

function DialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
	return (
		<DialogPrimitive.Backdrop
			className={cnWithState(
				className,
				"fixed inset-0 z-50 bg-black/80 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
			)}
			data-slot="dialog-overlay"
			{...props}
		/>
	);
}

const dialogContentVariants = tv({
	base: "fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg transition-[opacity,transform] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 sm:rounded-lg",
	variants: {
		size: {
			default: "max-w-lg",
			md: "max-w-2xl",
			lg: "max-w-4xl",
		},
	},
	defaultVariants: { size: "default" },
});

type DialogContentProps = {
	className?: string;
} & Omit<React.ComponentProps<typeof DialogPrimitive.Popup>, "className"> &
	VariantProps<typeof dialogContentVariants>;

function DialogContent({
	className,
	children,
	size,
	...props
}: DialogContentProps) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Viewport className="fixed inset-0 z-50 overflow-y-auto">
				<DialogPrimitive.Popup
					className={cn(dialogContentVariants({ size }), className)}
					data-slot="dialog-content"
					{...props}
				>
					{children}
				</DialogPrimitive.Popup>
			</DialogPrimitive.Viewport>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col space-y-1.5 text-center sm:text-left",
				className,
			)}
			data-slot="dialog-header"
			{...props}
		/>
	);
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				className,
			)}
			data-slot="dialog-footer"
			{...props}
		/>
	);
}

function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={cnWithState(
				className,
				"text-lg leading-none font-semibold tracking-tight",
			)}
			data-slot="dialog-title"
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			className={cnWithState(className, "text-sm text-muted-foreground")}
			data-slot="dialog-description"
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
