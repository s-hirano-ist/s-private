import { SKELETON_STACK_SIZE } from "@/constants";
import { ImageCardSkeleton } from "./image-card-skeleton";

export function ImageCardSkeletonStack() {
	return (
		<div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 sm:gap-4">
			{[...new Array(SKELETON_STACK_SIZE)].map((_, index) => (
				<ImageCardSkeleton key={String(index)} />
			))}
		</div>
	);
}
