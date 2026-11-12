import type { GetCount, GetPaginatedData } from "@/common/types";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import type { ContentStatus } from "@s-hirano-ist/s-api-client/models";
import { getBackendClient } from "@/common/backend/server-client";
import { configureContentCache } from "@/common/cache/content-cache";
import { PAGE_SIZE } from "@/common/constants";
import * as Sentry from "@sentry/nextjs";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";

const page = cache(
	async (
		offset: number,
		status: ContentStatus,
	): Promise<LinkCardStackInitialData> => {
		"use cache: private";
		configureContentCache("articles");
		const response = await (
			await getBackendClient()
		).listArticles({ offset, limit: PAGE_SIZE, status });
		return {
			data: response.data.data.map((article) => {
				const description = `${article.quote ? `${article.quote}\n` : ""}${article.ogTitle ? `${article.ogTitle}\n` : ""}${article.ogDescription ?? ""}`;
				return {
					id: article.id,
					key: article.id,
					title: article.title,
					href: article.url,
					primaryBadgeText: article.categoryName,
					secondaryBadgeText: new URL(article.url).hostname,
					description:
						description.length > 200
							? `${description.slice(0, 200)}...`
							: description,
				};
			}),
			totalCount: response.data.totalCount,
		};
	},
);
export const getExportedArticlesCount: GetCount = cache(async () => {
	"use cache: private";
	configureContentCache("articles");
	return (
		await (await getBackendClient()).countArticles({ status: "EXPORTED" })
	).data.count;
});
export const getUnexportedArticles: GetPaginatedData<
	LinkCardStackInitialData
> = (offset) => page(offset, "UNEXPORTED");
export const getExportedArticles: GetPaginatedData<LinkCardStackInitialData> = (
	offset,
) => page(offset, "EXPORTED");
async function readCategories() {
	"use cache: private";
	configureContentCache("articles");
	return (await (await getBackendClient()).listCategories()).data.data;
}

export const getCategories = cache(async () => {
	try {
		return await readCategories();
	} catch (error) {
		unstable_rethrow(error);
		Sentry.captureException(error);
		return [];
	}
});
