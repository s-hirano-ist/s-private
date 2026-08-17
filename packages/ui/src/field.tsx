import type * as React from "react";
import { cn } from "./utils/cn";

export type FieldProps = React.ComponentProps<"div">;

function Field({ className, ...props }: FieldProps) {
	return (
		<div
			className={cn("sui:space-y-1.5", className)}
			data-slot="field"
			{...props}
		/>
	);
}

export type FieldLabelProps = Omit<React.ComponentProps<"label">, "htmlFor"> & {
	htmlFor: string;
};

function FieldLabel({ className, htmlFor, ...props }: FieldLabelProps) {
	return (
		<label
			className={cn(
				"sui:text-sm sui:leading-none sui:font-medium sui:peer-disabled:cursor-not-allowed sui:peer-disabled:opacity-70",
				className,
			)}
			data-slot="field-label"
			htmlFor={htmlFor}
			{...props}
		/>
	);
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			className={cn("sui:text-sm sui:text-muted-foreground", className)}
			data-slot="field-description"
			{...props}
		/>
	);
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			className={cn("sui:text-sm sui:text-destructive", className)}
			data-slot="field-error"
			role="alert"
			{...props}
		/>
	);
}

export { Field, FieldDescription, FieldError, FieldLabel };
