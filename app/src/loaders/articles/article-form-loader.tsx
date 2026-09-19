import "server-only";
import type { ServerAction } from "@/common/types";
import type { BaseLoaderProps } from "@/loaders/types";
import { loadCategories } from "@/application-services/articles/load-categories";
import { ArticleForm } from "@/components/articles/client/article-form";

export type ArticleFormLoaderProps = BaseLoaderProps & {
	addArticle: (formData: FormData) => Promise<ServerAction>;
};

export function ArticleFormLoader({ addArticle }: ArticleFormLoaderProps) {
	return <ArticleForm addArticle={addArticle} getCategories={loadCategories} />;
}
