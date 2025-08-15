import { Skeleton } from "@/common/components/ui/skeleton";

const SKELETON_STACK_SIZE = 10;

export function ImageStackSkeleton() {
	return (
		<div className="grid grid-cols-4 gap-2 p-2 sm:p-4">
			{[...new Array(SKELETON_STACK_SIZE)].map((_, index) => (
				<Skeleton className="h-48 w-full" key={String(index)} />
			))}
		</div>
	);
}
