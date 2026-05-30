import "server-only";
import type { ServerAction } from "@/common/types";
import type { BaseLoaderProps } from "@/loaders/types";
import { getCategories } from "@/application-services/articles/get-articles";
import { ArticleForm } from "@/components/articles/client/article-form";

export type ArticleFormLoaderProps = BaseLoaderProps & {
	addArticle: (formData: FormData) => Promise<ServerAction>;
};

export async function ArticleFormLoader({
	addArticle,
}: ArticleFormLoaderProps) {
	const categories = await getCategories();

	return <ArticleForm addArticle={addArticle} categories={categories} />;
}
