import * as React from "react";

import { cn } from "@/utils/tailwindcss";

export type InputProps = {} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...properties }, reference) => {
		return (
			<input
				className={cn(
					"flex h-9 w-full rounded-md border border-primary-grad-from bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={reference}
				type={type}
				{...properties}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
