import type * as React from "react";

import { cn } from "@/utils/tailwindcss";

export type InputProps = {} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = ({
	ref,
	className,
	type,
	...props
}: InputProps & {
	ref: React.RefObject<HTMLInputElement>;
}) => {
	return (
		<input
			type={type}
			className={cn(
				"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
};
Input.displayName = "Input";

export { Input };
