import { SmallCardSkeleton } from "@/components/card/small-card-skeleton";
import { SKELETON_STACK_SIZE } from "@/constants";

export function CardStackSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 sm:gap-4">
			{[...new Array(SKELETON_STACK_SIZE)].map((_, index) => (
				<SmallCardSkeleton key={String(index)} />
			))}
		</div>
	);
}
