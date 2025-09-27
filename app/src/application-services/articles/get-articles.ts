import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import type { CacheStrategy } from "s-private-domains/articles/types/cache-strategy";
import {
	makeStatus,
	type Status,
	type UserId,
} from "s-private-domains/common/entities/common-entity";
import { SystemErrorEvent } from "s-private-domains/common/events/system-error-event";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import type { GetCount, GetPaginatedData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { ArticleFormClientData } from "@/components/articles/client/article-form-client";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import {
	articlesQueryRepository,
	categoryQueryRepository,
} from "@/infrastructures/articles/repositories/articles-query-repository";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";

export const _getArticles = async (
	currentCount: number,
	userId: UserId,
	status: Status,
	cacheStrategy?: CacheStrategy,
): Promise<LinkCardStackInitialData> => {
	"use cache";
	cacheTag(
		`articles_${status}_${userId}`,
		`articles_${status}_${userId}_${currentCount}`,
	);
	try {
		const articles = await articlesQueryRepository.findMany(userId, status, {
			skip: currentCount,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
			cacheStrategy,
		});

		const totalCount = await _getArticlesCount(userId, status);

		return {
			data: articles.map((d) => {
				const description = `${d.quote ? `${d.quote}\n` : ""}${d.ogTitle ? `${d.ogTitle}\n` : ""}${d.ogDescription ? d.ogDescription : ""}`;
				return {
					id: d.id,
					primaryBadgeText: d.Category.name,
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
	} catch (error) {
		throw error;
	}
};

const _getArticlesCount = async (
	userId: UserId,
	status: Status,
): Promise<number> => {
	"use cache";
	cacheTag(`articles_count_${status}_${userId}`);
	try {
		return await articlesQueryRepository.count(userId, status);
	} catch (error) {
		throw error;
	}
};

const _getCategories = async (
	userId: UserId,
): Promise<ArticleFormClientData> => {
	"use cache";
	cacheTag("categories", `categories_${userId}`);
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

export const getExportedArticlesCount: GetCount = cache(async () => {
	const userId = await getSelfId();
	return _getArticlesCount(userId, makeStatus("EXPORTED"));
});

export const getUnexportedArticles: GetPaginatedData<LinkCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getArticles(currentCount, userId, makeStatus("UNEXPORTED"));
	});

export const getExportedArticles: GetPaginatedData<LinkCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getArticles(currentCount, userId, makeStatus("EXPORTED"), {
			ttl: 400,
			swr: 40,
			tags: [`${sanitizeCacheTag(userId)}_articles_${currentCount}`],
		});
	});

export const getCategories = cache(async (): Promise<ArticleFormClientData> => {
	const userId = await getSelfId();
	return _getCategories(userId);
});
