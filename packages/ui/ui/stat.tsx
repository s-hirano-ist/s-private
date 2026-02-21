import type * as React from "react";

import { cn } from "../utils/cn";

/**
 * Props for the Stat component.
 *
 * @see {@link Stat} for the component
 */
export type StatProps = {
	/** Forwarded ref */
	ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * A container for displaying a statistic with title and value.
 *
 * @example
 * ```tsx
 * <Stat>
 *   <StatTitle>Total Users</StatTitle>
 *   <StatValue>1,234</StatValue>
 *   <StatDescription>+12% from last month</StatDescription>
 * </Stat>
 * ```
 */
function Stat({ className, ref, ...props }: StatProps) {
	return (
		<div
			className={cn(
				"rounded-lg border border-muted bg-background p-4 shadow-sm",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
Stat.displayName = "Stat";

/**
 * Props for the StatTitle component.
 */
export type StatTitleProps = {
	ref?: React.Ref<HTMLSpanElement>;
} & React.HTMLAttributes<HTMLSpanElement>;

/**
 * Title label for a Stat component.
 */
function StatTitle({ className, ref, ...props }: StatTitleProps) {
	return (
		<span
			className={cn("text-muted-foreground text-sm", className)}
			ref={ref}
			{...props}
		/>
	);
}
StatTitle.displayName = "StatTitle";

/**
 * Props for the StatValue component.
 */
export type StatValueProps = {
	ref?: React.Ref<HTMLSpanElement>;
} & React.HTMLAttributes<HTMLSpanElement>;

/**
 * Large value display for a Stat component.
 */
function StatValue({ className, ref, ...props }: StatValueProps) {
	return (
		<span
			className={cn("font-bold text-2xl text-primary", className)}
			ref={ref}
			{...props}
		/>
	);
}
StatValue.displayName = "StatValue";

/**
 * Props for the StatDescription component.
 */
export type StatDescriptionProps = {
	ref?: React.Ref<HTMLSpanElement>;
} & React.HTMLAttributes<HTMLSpanElement>;

/**
 * Optional description text for a Stat component.
 */
function StatDescription({ className, ref, ...props }: StatDescriptionProps) {
	return (
		<span
			className={cn("text-muted-foreground text-xs", className)}
			ref={ref}
			{...props}
		/>
	);
}
StatDescription.displayName = "StatDescription";

export { Stat, StatTitle, StatValue, StatDescription };
