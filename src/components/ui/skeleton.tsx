import { cn } from "@/utils/tailwindcss";

function Skeleton({
	className,
	...properties
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("animate-pulse rounded-md bg-primary/10", className)}
			data-testid="skeleton"
			role="presentation"
			{...properties}
		/>
	);
}

export { Skeleton };
