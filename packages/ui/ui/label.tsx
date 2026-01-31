"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Label as LabelPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "../utils/cn";

/**
 * Label style variants using class-variance-authority.
 * @internal
 */
const labelVariants = cva(
	"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

/**
 * Props for the Label component.
 *
 * @see {@link Label} for the component
 */
type LabelProps = {
	/** Forwarded ref */
	ref?: React.Ref<React.ComponentRef<typeof LabelPrimitive.Root>>;
} & React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
	VariantProps<typeof labelVariants>;

/**
 * A label component for form inputs.
 *
 * @remarks
 * Built on Radix UI Label primitive. Provides accessible labeling
 * for form controls with proper styling and disabled state handling.
 *
 * @param props - Radix Label props including htmlFor
 * @returns A styled label element
 *
 * @example
 * ```tsx
 * <Label htmlFor="email">Email</Label>
 * <Input id="email" type="email" />
 * ```
 */
function Label({ className, ref, ...props }: LabelProps) {
	return (
		<LabelPrimitive.Root
			className={cn(labelVariants(), className)}
			ref={ref}
			{...props}
		/>
	);
}
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
