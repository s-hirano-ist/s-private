"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Label as LabelPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../utils/cn";

/**
 * Label style variants using class-variance-authority.
 * @internal
 */
const labelVariants = cva(
	"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

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
const Label = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
		VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
	<LabelPrimitive.Root
		className={cn(labelVariants(), className)}
		ref={ref}
		{...props}
	/>
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
