import type { DeleteAction, LoadMoreAction } from "@/common/types";
import { ImageCardStack } from "@/components/common/layouts/cards/image-card-stack";
import type { ImageCardStackInitialData } from "@/components/common/layouts/cards/types";

export type Props = {
	initialData: ImageCardStackInitialData;
	deleteAction?: DeleteAction;
	loadMoreAction: LoadMoreAction<ImageCardStackInitialData>;
};

export function BooksStack({
	initialData,
	deleteAction,
	loadMoreAction,
}: Props) {
	return (
		<ImageCardStack
			basePath="book"
			deleteAction={deleteAction}
			initial={initialData}
			loadMoreAction={loadMoreAction}
		/>
	);
}
