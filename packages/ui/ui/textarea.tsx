import * as React from "react";

import { cn } from "../utils/cn";

/**
 * Props for the Textarea component.
 *
 * @see {@link Textarea} for the component
 */
export type TextareaProps = {
	/** Forwarded ref */
	ref?: React.Ref<HTMLTextAreaElement>;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * A styled multi-line text input component.
 *
 * @remarks
 * Textarea is a styled wrapper around the native HTML textarea element.
 * Supports all standard textarea attributes including rows and cols.
 *
 * @param props - Standard textarea attributes including placeholder, rows, etc.
 * @returns A styled textarea element
 *
 * @example
 * ```tsx
 * // Basic textarea
 * <Textarea placeholder="Enter your message..." />
 *
 * // With specific row count
 * <Textarea rows={5} placeholder="Write your content..." />
 * ```
 */
function Textarea({ className, ref, ...props }: TextareaProps) {
	return (
		<textarea
			className={cn(
				"flex min-h-[60px] w-full rounded-md border border-muted bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
Textarea.displayName = "Textarea";

export { Textarea };
