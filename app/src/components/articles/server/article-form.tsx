import type { ServerAction } from "@/common/types";
import {
	ArticleFormClient,
	type ArticleFormClientData,
} from "../client/article-form-client";

type Props = {
	addArticle: (formData: FormData) => Promise<ServerAction>;
	categories: ArticleFormClientData;
};

export function ArticleForm({ addArticle, categories }: Props) {
	return <ArticleFormClient addArticle={addArticle} categories={categories} />;
}
