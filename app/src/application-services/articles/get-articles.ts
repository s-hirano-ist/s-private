/**
 * Article query application services.
 *
 * @remarks
 * Provides cached data access for articles with pagination support.
 * Uses Next.js cache tags for efficient cache invalidation.
 *
 * @module
 */

import {
	makeExportedStatus,
	makeUnexportedStatus,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { SystemErrorEvent } from "@s-hirano-ist/s-core/shared-kernel/events/system-error-event";
import { cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import type { GetCount, GetPaginatedData } from "@/common/types";
import type { ArticleFormData } from "@/components/articles/client/article-form";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
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
const _getArticles = async (
	currentCount: number,
	userId: UserId,
	status: Status,
): Promise<LinkCardStackInitialData> => {
	"use cache";
	cacheTag(
		buildContentCacheTag("articles", status, userId),
		buildPaginatedContentCacheTag("articles", status, userId, currentCount),
	);
	const [articles, totalCount] = await Promise.all([
		articlesQueryRepository.findMany(userId, status, {
			skip: currentCount,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
		}),
		_getArticlesCount(userId, status),
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
};

/**
 * Gets total count of articles for a user and status.
 *
 * @param userId - User ID for data isolation
 * @param status - Article status filter
 * @returns Total count of matching articles
 *
 * @internal
 */
const _getArticlesCount = async (
	userId: UserId,
	status: Status,
): Promise<number> => {
	"use cache";
	cacheTag(buildCountCacheTag("articles", status, userId));
	return await articlesQueryRepository.count(userId, status);
};

/**
 * Fetches all categories for article form dropdown.
 *
 * @param userId - User ID for data isolation
 * @returns Array of category names for form selection
 *
 * @internal
 */
const _getCategories = async (userId: UserId): Promise<ArticleFormData> => {
	"use cache";
	cacheTag("categories", buildCategoriesCacheTag(userId));
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
};

/**
 * Gets the total count of exported articles for the current user.
 *
 * @returns Total count of exported articles
 */
export const getExportedArticlesCount: GetCount = cache(async () => {
	const userId = await getSelfId();
	return _getArticlesCount(userId, makeExportedStatus().status);
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
		return _getArticles(currentCount, userId, makeUnexportedStatus());
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
		return _getArticles(currentCount, userId, makeExportedStatus().status);
	});

/**
 * Fetches all categories for the current user's article form.
 *
 * @returns Array of category names for dropdown selection
 */
export const getCategories = cache(async (): Promise<ArticleFormData> => {
	const userId = await getSelfId();
	return _getCategories(userId);
});
