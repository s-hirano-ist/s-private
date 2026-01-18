import "server-only";

import { getCategories } from "@/application-services/articles/get-articles";
import type { ServerAction } from "@/common/types";
import { ArticleForm } from "@/components/articles/server/article-form";
import type { BaseLoaderProps } from "@/loaders/types";

export type ArticleFormLoaderProps = BaseLoaderProps & {
	addArticle: (formData: FormData) => Promise<ServerAction>;
};

export async function ArticleFormLoader({
	addArticle,
}: ArticleFormLoaderProps) {
	const categories = await getCategories();

	return <ArticleForm addArticle={addArticle} categories={categories} />;
}
