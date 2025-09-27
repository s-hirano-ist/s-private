import type { getCategories } from "@/application-services/articles/get-articles";
import type { ServerAction } from "@/common/types";
import { ArticleFormClient } from "../client/article-form-client";

type Props = {
	addArticle: (formData: FormData) => Promise<ServerAction>;
	getCategories: typeof getCategories;
};

export async function ArticleForm({ addArticle, getCategories }: Props) {
	const categories = await getCategories();

	return <ArticleFormClient addArticle={addArticle} categories={categories} />;
}
