import { Skeleton } from "@/components/ui/skeleton";
import { SKELETON_STACK_SIZE } from "@/constants";

export function ImageStackSkeleton() {
	return (
		<div className="grid grid-cols-4 gap-2 p-2 sm:p-4">
			{[...new Array(SKELETON_STACK_SIZE)].map((_, index) => (
				<Skeleton className="h-48 w-full" key={String(index)} />
			))}
		</div>
	);
}
