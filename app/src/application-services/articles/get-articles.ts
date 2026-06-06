/**
 * Article query application services.
 *
 * @remarks
 * Provides cached data access for articles with pagination support.
 * Uses Next.js cache tags for efficient cache invalidation.
 *
 * @module
 */

import type { GetCount, GetPaginatedData } from "@/common/types";
import type { ArticleFormData } from "@/components/articles/client/article-form";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import { tenantContext } from "@/common/tenant/tenant-context";
import {
	articlesQueryRepository,
	categoryQueryRepository,
} from "@/infrastructures/articles/repositories/articles-query-repository";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import {
	buildCategoriesCacheTag,
	buildContentCacheTag,
	buildCountCacheTag,
	buildPaginatedContentCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import {
	makeExportedStatus,
	makeUnexportedStatus,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { SystemErrorEvent } from "@s-hirano-ist/s-core/shared-kernel/events/system-error-event";
import { unstable_cache } from "next/cache";
import { cache } from "react";

/**
 * Gets total count of articles for a user and status.
 *
 * @param userId - User ID for data isolation
 * @param status - Article status filter
 * @returns Total count of matching articles
 *
 * @internal
 */
const getArticlesCountCached = async (
	userId: UserId,
	status: Status,
): Promise<number> => {
	return unstable_cache(
		() => articlesQueryRepository.count(userId, status),
		["articles", "count", userId, status],
		{ tags: [buildCountCacheTag("articles", status, userId)] },
	)();
};

/**
 * Fetches paginated articles with cache support.
 *
 * @param currentCount - Number of items to skip (offset)
 * @param userId - User ID for data isolation
 * @param status - Article status filter (UNEXPORTED/EXPORTED)
 * @returns Paginated article data with total count
 *
 * @internal
 */
const getArticlesCached = async (
	currentCount: number,
	userId: UserId,
	status: Status,
): Promise<LinkCardStackInitialData> => {
	return unstable_cache(
		async () => {
			const [articles, totalCount] = await Promise.all([
				articlesQueryRepository.findMany(userId, status, {
					skip: currentCount,
					take: PAGE_SIZE,
					orderBy: { createdAt: "desc" },
				}),
				getArticlesCountCached(userId, status),
			]);

			return {
				data: articles.map((d) => {
					const description = `${d.quote ? `${d.quote}\n` : ""}${d.ogTitle ? `${d.ogTitle}\n` : ""}${d.ogDescription ? d.ogDescription : ""}`;
					return {
						id: d.id,
						primaryBadgeText: d.categoryName,
						secondaryBadgeText: new URL(d.url).hostname,
						key: d.id,
						title: d.title,
						description:
							description.length > 200
								? `${description.slice(0, 200)}...`
								: description,
						href: d.url,
					};
				}),
				totalCount,
			};
		},
		["articles", "list", userId, status, String(currentCount)],
		{
			tags: [
				buildContentCacheTag("articles", status, userId),
				buildPaginatedContentCacheTag("articles", status, userId, currentCount),
			],
		},
	)();
};

/**
 * Fetches all categories for article form dropdown.
 *
 * @param userId - User ID for data isolation
 * @returns Array of category names for form selection
 *
 * @internal
 */
const getCategoriesCached = async (
	userId: UserId,
): Promise<ArticleFormData> => {
	return unstable_cache(
		async () => {
			try {
				const response = await categoryQueryRepository.findMany(userId, {
					orderBy: { name: "asc" },
				});
				return response;
			} catch (error) {
				initializeEventHandlers();
				await eventDispatcher.dispatch(
					new SystemErrorEvent({
						message: "unexpected",
						status: 500,
						caller: "AddArticleFormCategory",
						extraData: error,
					}),
				);
				// not critical for viewer nor dumper
				return [];
			}
		},
		["articles", "categories", userId],
		{ tags: ["categories", buildCategoriesCacheTag(userId)] },
	)();
};

/**
 * Gets the total count of exported articles for the current user.
 *
 * @returns Total count of exported articles
 */
export const getExportedArticlesCount: GetCount = cache(async () => {
	const userId = await getSelfId();
	return tenantContext.run({ userId }, () =>
		getArticlesCountCached(userId, makeExportedStatus().status),
	);
});

/**
 * Fetches paginated unexported articles for the current user.
 *
 * @param currentCount - Number of items to skip (offset)
 * @returns Paginated article data for dumper view
 */
export const getUnexportedArticles: GetPaginatedData<LinkCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return tenantContext.run({ userId }, () =>
			getArticlesCached(currentCount, userId, makeUnexportedStatus()),
		);
	});

/**
 * Fetches paginated exported articles for the current user.
 *
 * @param currentCount - Number of items to skip (offset)
 * @returns Paginated article data for viewer
 */
export const getExportedArticles: GetPaginatedData<LinkCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return tenantContext.run({ userId }, () =>
			getArticlesCached(currentCount, userId, makeExportedStatus().status),
		);
	});

/**
 * Fetches all categories for the current user's article form.
 *
 * @returns Array of category names for dropdown selection
 */
export const getCategories = cache(async (): Promise<ArticleFormData> => {
	const userId = await getSelfId();
	return tenantContext.run({ userId }, () => getCategoriesCached(userId));
});
