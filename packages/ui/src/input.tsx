import type * as React from "react";
import { cn } from "./utils/cn.js";

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
				"sui:flex sui:h-9 sui:w-full sui:rounded-md sui:border sui:border-muted sui:bg-transparent sui:px-3 sui:py-1 sui:text-base sui:shadow-xs sui:transition-colors sui:file:border-0 sui:file:bg-transparent sui:file:text-base sui:file:font-medium sui:placeholder:text-muted-foreground sui:focus-visible:ring-1 sui:focus-visible:ring-primary sui:focus-visible:outline-hidden sui:disabled:cursor-not-allowed sui:disabled:opacity-50",
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
