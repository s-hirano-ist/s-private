"use client";

import type * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { tv, type VariantProps } from "tailwind-variants";
import { cn, cnWithState } from "./utils/cn.js";

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
				"sui:fixed sui:inset-0 sui:z-50 sui:bg-black/80 sui:transition-opacity sui:duration-200 sui:data-[ending-style]:opacity-0 sui:data-[starting-style]:opacity-0",
			)}
			data-slot="dialog-overlay"
			{...props}
		/>
	);
}

const dialogContentVariants = tv({
	base: "sui:fixed sui:top-1/2 sui:left-1/2 sui:z-50 sui:grid sui:w-full sui:-translate-x-1/2 sui:-translate-y-1/2 sui:gap-4 sui:border sui:bg-background sui:p-6 sui:shadow-lg sui:transition-[opacity,transform] sui:duration-200 sui:data-[ending-style]:scale-95 sui:data-[ending-style]:opacity-0 sui:data-[starting-style]:scale-95 sui:data-[starting-style]:opacity-0 sui:sm:rounded-lg",
	variants: {
		size: {
			default: "sui:max-w-lg",
			md: "sui:max-w-2xl",
			lg: "sui:max-w-4xl",
		},
	},
	defaultVariants: { size: "default" },
});

type DialogContentProps = {
	className?: React.ComponentProps<typeof DialogPrimitive.Popup>["className"];
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
			<DialogPrimitive.Viewport className="sui:fixed sui:inset-0 sui:z-50 sui:overflow-y-auto">
				<DialogPrimitive.Popup
					className={cnWithState(className, dialogContentVariants({ size }))}
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
				"sui:flex sui:flex-col sui:space-y-1.5 sui:text-center sui:sm:text-left",
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
				"sui:flex sui:flex-col-reverse sui:gap-2 sui:sm:flex-row sui:sm:justify-end",
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
				"sui:text-lg sui:leading-none sui:font-semibold sui:tracking-tight",
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
			className={cnWithState(
				className,
				"sui:text-sm sui:text-muted-foreground",
			)}
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
