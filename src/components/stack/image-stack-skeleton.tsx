import { Skeleton } from "@/components/ui/skeleton";
import { SKELETON_STACK_SIZE } from "@/constants";

export function ImageStackSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 sm:gap-4">
			{[...Array(SKELETON_STACK_SIZE)].map((_, index) => (
				<Skeleton className="h-32 w-full" key={String(index)} />
			))}
		</div>
	);
}
