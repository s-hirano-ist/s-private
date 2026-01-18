import "server-only";

import { getCategories } from "@/application-services/articles/get-articles";
import type { ServerAction } from "@/common/types";
import { ArticleFormClient } from "@/components/articles/client/article-form-client";
import type { BaseLoaderProps } from "@/loaders/types";

export type ArticleFormLoaderProps = BaseLoaderProps & {
	addArticle: (formData: FormData) => Promise<ServerAction>;
};

export async function ArticleFormLoader({
	addArticle,
}: ArticleFormLoaderProps) {
	const categories = await getCategories();

	return <ArticleFormClient addArticle={addArticle} categories={categories} />;
}
