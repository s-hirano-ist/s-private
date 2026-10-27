import type { DeleteAction, LoadMoreAction } from "@/common/types";
import type { ImageData } from "@/components/common/display/image/image-stack";
import type { CardStackInitialData } from "@/components/common/layouts/cards/types";
import { InfiniteImageStack } from "@/components/common/display/image/image-stack";

type ImagesInitialData = CardStackInitialData<ImageData>;

export type ImagesStackProps = {
	deleteAction?: DeleteAction;
	initialData: ImagesInitialData;
	loadMoreAction: LoadMoreAction<ImagesInitialData>;
};

export function ImagesStack({
	deleteAction,
	initialData,
	loadMoreAction,
}: ImagesStackProps) {
	return (
		<InfiniteImageStack
			deleteAction={deleteAction}
			initial={initialData}
			loadMoreAction={loadMoreAction}
		/>
	);
}
