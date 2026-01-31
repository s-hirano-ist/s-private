"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../utils/cn";

/**
 * Root dialog component for modal overlays.
 *
 * @remarks
 * Built on Radix UI Dialog primitive. Provides accessible modal dialogs
 * with focus trapping and keyboard navigation.
 *
 * @example
 * ```tsx
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogTrigger asChild>
 *     <Button>Open Dialog</Button>
 *   </DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Dialog Title</DialogTitle>
 *       <DialogDescription>Dialog description text.</DialogDescription>
 *     </DialogHeader>
 *     <p>Dialog content</p>
 *     <DialogFooter>
 *       <Button>Close</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 *
 * @see {@link DialogContent} for the dialog body
 * @see {@link DialogTrigger} for the trigger button
 */
const Dialog = DialogPrimitive.Root;

/**
 * Button or element that opens the dialog.
 *
 * @see {@link Dialog} for parent component
 */
const DialogTrigger = DialogPrimitive.Trigger;

/**
 * Portal for rendering dialog outside the DOM hierarchy.
 * @internal
 */
const DialogPortal = DialogPrimitive.Portal;

/**
 * Semi-transparent overlay behind the dialog.
 *
 * @remarks
 * Automatically included by DialogContent.
 * Provides backdrop blur and click-outside-to-close behavior.
 */
const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const dialogContentVariants = cva(
	"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:rounded-lg",
	{
		variants: {
			size: {
				default: "max-w-lg",
				md: "max-w-2xl",
				lg: "max-w-4xl",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

/**
 * Main content container for the dialog.
 *
 * @remarks
 * Centered modal with overlay, animations, and proper styling.
 * Includes the DialogOverlay automatically.
 *
 * @param props - Content props including size variant option
 * @returns A styled dialog content container
 *
 * @see {@link Dialog} for parent component
 * @see {@link DialogHeader} for header section
 * @see {@link DialogFooter} for footer section
 */
const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
		VariantProps<typeof dialogContentVariants>
>(({ className, children, size, ...props }, ref) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			className={cn(dialogContentVariants({ size }), className)}
			ref={ref}
			{...props}
		>
			{children}
		</DialogPrimitive.Content>
	</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * Header section for dialog title and description.
 *
 * @see {@link DialogTitle} for the title element
 * @see {@link DialogDescription} for the description element
 */
function DialogHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex flex-col space-y-1.5 text-center sm:text-left",
				className,
			)}
			{...props}
		/>
	);
}
DialogHeader.displayName = "DialogHeader";

/**
 * Footer section for dialog actions.
 *
 * @remarks
 * Typically contains buttons for confirm/cancel actions.
 * Uses flexbox with responsive layout.
 */
function DialogFooter({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				className,
			)}
			{...props}
		/>
	);
}
DialogFooter.displayName = "DialogFooter";

/**
 * Title element for the dialog.
 *
 * @remarks
 * Provides accessible naming for the dialog.
 *
 * @see {@link DialogHeader} for parent section
 */
const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		className={cn(
			"font-semibold text-lg leading-none tracking-tight",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * Description text for the dialog.
 *
 * @remarks
 * Provides accessible description for the dialog content.
 *
 * @see {@link DialogHeader} for parent section
 */
const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		className={cn("text-muted-foreground text-sm", className)}
		ref={ref}
		{...props}
	/>
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
};
