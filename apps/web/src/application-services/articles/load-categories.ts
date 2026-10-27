"use server";

import type { ArticleFormData } from "@/components/articles/client/article-form";
import { getCategories } from "@/application-services/articles/get-articles";

/** Loads category choices when the article category combobox is first opened. */
export async function loadCategories(): Promise<ArticleFormData> {
	return getCategories();
}
