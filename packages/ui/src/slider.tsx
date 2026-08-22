import type * as React from "react";
import { cn } from "./utils/cn.js";

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
				"sui:h-1 sui:w-full sui:cursor-pointer sui:appearance-none sui:rounded-lg sui:bg-muted sui:accent-primary sui:disabled:cursor-not-allowed sui:disabled:opacity-50",
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
