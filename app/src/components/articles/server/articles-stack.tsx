import type {
	DeleteAction,
	GetPaginatedData,
	LoadMoreAction,
} from "@/common/types";
import { LinkCardStack } from "@/components/common/layouts/cards/link-card-stack";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";

export type Props = {
	getArticles: GetPaginatedData<LinkCardStackInitialData>;
	deleteArticle?: DeleteAction;
	loadMoreAction: LoadMoreAction<LinkCardStackInitialData>;
};

export async function ArticlesStack({
	getArticles,
	deleteArticle,
	loadMoreAction,
}: Props) {
	const articles = await getArticles(0);

	return (
		<LinkCardStack
			deleteAction={deleteArticle}
			initial={articles}
			loadMoreAction={loadMoreAction}
		/>
	);
}
