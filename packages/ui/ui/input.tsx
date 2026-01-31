import * as React from "react";

import { cn } from "../utils/cn";

/**
 * Props for the Input component.
 *
 * @see {@link Input} for the component
 */
export type InputProps = {
	/** Forwarded ref */
	ref?: React.Ref<HTMLInputElement>;
} & React.InputHTMLAttributes<HTMLInputElement>;

/**
 * A styled text input component.
 *
 * @remarks
 * Input is a styled wrapper around the native HTML input element.
 * It supports all standard input types and attributes.
 *
 * @param props - Standard input attributes including type, placeholder, etc.
 * @returns A styled input element
 *
 * @example
 * ```tsx
 * // Basic text input
 * <Input placeholder="Enter text..." />
 *
 * // Email input
 * <Input type="email" placeholder="email@example.com" />
 *
 * // Disabled input
 * <Input disabled value="Cannot edit" />
 * ```
 */
function Input({ className, type, ref, ...props }: InputProps) {
	return (
		<input
			className={cn(
				"flex h-9 w-full rounded-md border border-muted bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:font-medium file:text-base placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			ref={ref}
			type={type}
			{...props}
		/>
	);
}
Input.displayName = "Input";

export { Input };
