import "server-only";

import { getExportedArticlesCount } from "@/application-services/articles/get-articles";
import { ArticlesCounter } from "@/components/articles/server/articles-counter";
import type { CounterLoaderProps } from "@/loaders/types";

export type ArticlesCounterLoaderProps = CounterLoaderProps;

export async function ArticlesCounterLoader(
	_props: ArticlesCounterLoaderProps,
) {
	const count = await getExportedArticlesCount();

	return <ArticlesCounter count={count} />;
}
