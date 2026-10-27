import "server-only";
import type { PaginatedLinkCardLoaderProps } from "@/loaders/types";
import {
	getExportedArticles,
	getUnexportedArticles,
} from "@/application-services/articles/get-articles";
import { ArticlesStack } from "@/components/articles/server/articles-stack";

export type ArticlesStackLoaderProps = PaginatedLinkCardLoaderProps & {
	variant: "exported" | "unexported";
};

export async function ArticlesStackLoader({
	variant,
	deleteAction,
	loadMoreAction,
}: ArticlesStackLoaderProps) {
	const getData =
		variant === "exported" ? getExportedArticles : getUnexportedArticles;

	const initialData = await getData(0);

	return (
		<ArticlesStack
			deleteAction={deleteAction}
			initialData={initialData}
			loadMoreAction={loadMoreAction}
		/>
	);
}
