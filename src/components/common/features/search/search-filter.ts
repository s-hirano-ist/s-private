"use server";
import "server-only";
import { loadMoreExportedArticles } from "@/application-services/articles/get-articles-from-client";

export async function search(searchQuery: string) {
	const tempCount = searchQuery.length;
	return await loadMoreExportedArticles(tempCount + 1);
}
