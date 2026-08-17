import type * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "../utils/cn";

/**
 * Label style variants using tailwind-variants.
 * @internal
 */
const labelVariants = tv({
	base: "text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
});

/**
 * Props for the Label component.
 *
 * @see {@link Label} for the component
 */
type LabelProps = {
	ref?: React.Ref<HTMLLabelElement>;
} & React.ComponentPropsWithoutRef<"label"> &
	VariantProps<typeof labelVariants>;

/**
 * A label component for form inputs.
 *
 * @remarks
 * Uses the native label element for accessible form-control association.
 *
 * @param props - Native label props including htmlFor
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
		// The associated control is supplied by consumers through htmlFor or children.
		// oxlint-disable-next-line jsx-a11y/label-has-associated-control
		<label className={cn(labelVariants(), className)} ref={ref} {...props} />
	);
}

export { Label };
