import "server-only";
import type { CounterLoaderProps } from "@/loaders/types";
import { getExportedArticlesCount } from "@/application-services/articles/get-articles";
import { ArticlesCounter } from "@/components/articles/server/articles-counter";

export type ArticlesCounterLoaderProps = CounterLoaderProps;

export async function ArticlesCounterLoader(
	_props: ArticlesCounterLoaderProps,
) {
	const count = await getExportedArticlesCount();

	return <ArticlesCounter count={count} />;
}
