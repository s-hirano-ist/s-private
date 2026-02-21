import type * as React from "react";

import { cn } from "../utils/cn";

/**
 * Props for the Slider component.
 *
 * @see {@link Slider} for the component
 */
export type SliderProps = {
	/** Forwarded ref */
	ref?: React.Ref<HTMLInputElement>;
} & React.InputHTMLAttributes<HTMLInputElement>;

/**
 * A styled range slider input component.
 *
 * @param props - Standard input attributes for range inputs
 * @returns A styled range input element
 *
 * @example
 * ```tsx
 * <Slider min={1} max={5} value={3} step={1} onChange={handleChange} />
 * ```
 */
function Slider({ className, ref, ...props }: SliderProps) {
	return (
		<input
			className={cn(
				"h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			ref={ref}
			type="range"
			{...props}
		/>
	);
}
Slider.displayName = "Slider";

export { Slider };
