import type {
	DeleteAction,
	GetPaginatedData,
	LoadMoreAction,
} from "@/common/types";
import { LinkCardStack } from "@/components/common/layouts/cards/link-card-stack";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";

export type Props = {
	getNews: GetPaginatedData<LinkCardStackInitialData>;
	deleteNews?: DeleteAction;
	loadMoreAction: LoadMoreAction<LinkCardStackInitialData>;
};

export async function NewsStack({
	getNews,
	deleteNews,
	loadMoreAction,
}: Props) {
	const news = await getNews(0);

	return (
		<LinkCardStack
			deleteAction={deleteNews}
			initial={news}
			loadMoreAction={loadMoreAction}
		/>
	);
}
