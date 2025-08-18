import type { ServerAction, ServerActionWithData } from "@/common/types";
import { ImageCardStack } from "@/components/common/layouts/cards/image-card-stack";
import type { ImageCardStackInitialData } from "@/components/common/layouts/cards/types";

export type Props = {
	getBooks(page: number): Promise<ImageCardStackInitialData>;
	deleteBooks?: (id: string) => Promise<ServerAction>;
	loadMoreAction: (
		currentCount: number,
	) => Promise<ServerActionWithData<ImageCardStackInitialData>>;
};

export async function BooksStack({
	getBooks,
	deleteBooks,
	loadMoreAction,
}: Props) {
	const data = await getBooks(0);

	return (
		<ImageCardStack
			basePath="book"
			deleteAction={deleteBooks}
			initial={data}
			loadMoreAction={loadMoreAction}
		/>
	);
}
