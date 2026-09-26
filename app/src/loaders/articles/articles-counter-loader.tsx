import "server-only";
import type { CounterLoaderProps } from "@/loaders/types";
import { getExportedArticlesCount } from "@/application-services/articles/get-articles";
import { ViewerCountSync } from "@/components/common/layouts/nav/viewer-count-context";

export type ArticlesCounterLoaderProps = CounterLoaderProps;

export async function ArticlesCounterLoader(
	_props: ArticlesCounterLoaderProps,
) {
	const count = await getExportedArticlesCount();

	return <ViewerCountSync count={count} domain="articles" />;
}
