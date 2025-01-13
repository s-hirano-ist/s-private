import { cn } from "@/utils/tailwindcss";

function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("animate-pulse rounded-md bg-primary/10", className)}
			role="presentation"
			data-testid="skeleton"
			{...props}
		/>
	);
}

export { Skeleton };
