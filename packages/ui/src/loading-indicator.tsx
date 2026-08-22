import type * as React from "react";
import { cn } from "./utils/cn.js";

export type LoadingIndicatorProps = {
	label?: string;
} & React.ComponentProps<"output">;

export function LoadingIndicator({
	className,
	label = "Loading",
	...props
}: LoadingIndicatorProps) {
	return (
		<output
			aria-label={label}
			className={cn(
				"sui:flex sui:h-full sui:items-center sui:justify-center sui:gap-1.5 sui:p-16",
				className,
			)}
			{...props}
		>
			<span
				className="sui:size-2 sui:animate-[sui-loading-dot_1.4s_ease-in-out_infinite] sui:rounded-full sui:bg-primary"
				data-slot="loading-indicator-dot"
			/>
			<span
				className="sui:size-2 sui:animate-[sui-loading-dot_1.4s_ease-in-out_0.2s_infinite] sui:rounded-full sui:bg-primary"
				data-slot="loading-indicator-dot"
			/>
			<span
				className="sui:size-2 sui:animate-[sui-loading-dot_1.4s_ease-in-out_0.4s_infinite] sui:rounded-full sui:bg-primary"
				data-slot="loading-indicator-dot"
			/>
		</output>
	);
}
