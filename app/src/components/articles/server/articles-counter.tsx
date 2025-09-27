import type { GetCount } from "@/common/types";
import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	getArticlesCount: GetCount;
};

export async function ArticlesCounter({ getArticlesCount }: Props) {
	const articlesCount = await getArticlesCount();

	return <CounterBadge label="totalArticles" totalItems={articlesCount} />;
}
