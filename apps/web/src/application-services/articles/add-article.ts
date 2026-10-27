"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { backendActionError } from "@/common/backend/action-error";
import { getBackendClient } from "@/common/backend/server-client";
import { ArticleCreate } from "@s-hirano-ist/s-api-client/models";
import { refresh } from "next/cache";
export async function addArticle(formData: FormData): Promise<ServerAction> {
	try {
		const input = ArticleCreate.parse({
			operationId: formData.get("operationId"),
			title: formData.get("title"),
			url: formData.get("url"),
			category: formData.get("category"),
			quote: formData.get("quote") ?? undefined,
		});
		await (await getBackendClient()).createArticles(input);
		refresh();
		return { success: true, message: "inserted" };
	} catch (error) {
		return backendActionError(error, formData);
	}
}
