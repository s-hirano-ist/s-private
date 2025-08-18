import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import { LinkCardStackInitialData } from "@/components/common/layouts/cards/link-card-stack";
import type { NewsFormClientData } from "@/components/news/client/news-form-client";
import { Result } from "@/domains/common/value-objects";
import type { NewsStatus, UserId } from "@/domains/news/entities/news-entity";
import type { CacheStrategy } from "@/domains/news/types";
import {
	CategoryName,
	NewsQuote,
	NewsTitle,
	NewsUrl,
} from "@/domains/news/value-objects";
import {
	categoryQueryRepository,
	newsQueryRepository,
} from "@/infrastructures/news/repositories/news-query-repository";
import { serverLogger } from "@/infrastructures/observability/server";

export const _getNews = async (
	currentCount: number,
	userId: UserId,
	status: NewsStatus,
	cacheStrategy?: CacheStrategy,
): Promise<LinkCardStackInitialData> => {
	"use cache";
	cacheTag(
		`news_${status}_${userId}`,
		`news_${status}_${userId}_${currentCount}`,
	);

	const newsResult = await newsQueryRepository.findMany(userId, status, {
		skip: currentCount,
		take: PAGE_SIZE,
		orderBy: { createdAt: "desc" },
		cacheStrategy,
	});

	if (newsResult.isFailure) {
		throw new Error(newsResult.error.message);
	}

	const totalCountResult = await _getNewsCount(userId, status);
	if (totalCountResult.isFailure) {
		throw new Error(totalCountResult.error.message);
	}

	return {
		data: newsResult.value.map((news) => ({
			id: news.id,
			primaryBadgeText: CategoryName.unwrap(news.category.name),
			secondaryBadgeText: new URL(NewsUrl.unwrap(news.url)).hostname,
			key: news.id,
			title: NewsTitle.unwrap(news.title),
			description:
				`${news.quote ? NewsQuote.unwrap(news.quote) : ""} \n ${news.openGraphMetadata?.title || ""} \n ${news.openGraphMetadata?.description || ""}`.slice(
					0,
					200,
				) + "...",
			href: NewsUrl.unwrap(news.url),
		})),
		totalCount: totalCountResult.value,
	};
};

const _getNewsCount = async (
	userId: UserId,
	status: NewsStatus,
): Promise<Result<number, Error>> => {
	"use cache";
	cacheTag(`news_count_${status}_${userId}`);

	const countResult = await newsQueryRepository.count(userId, status);
	if (countResult.isFailure) {
		return Result.failure(new Error(countResult.error.message));
	}

	return Result.success(countResult.value);
};

const _getCategories = async (userId: UserId): Promise<NewsFormClientData> => {
	"use cache";
	cacheTag(`categories`, `categories_${userId}`);

	const categoriesResult = await categoryQueryRepository.findMany(userId, {
		orderBy: { name: "asc" },
	});

	if (categoriesResult.isFailure) {
		serverLogger.error(
			"unexpected",
			{ caller: "AddNewsFormCategory", status: 500 },
			categoriesResult.error,
		);
		// not critical for viewer nor dumper
		return [];
	}

	return categoriesResult.value.map((category) => ({
		id: category.id,
		name: CategoryName.unwrap(category.name),
	}));
};

export type GetNewsCount = () => Promise<number>;

export const getUnexportedNewsCount: GetNewsCount = cache(async () => {
	const userId = await getSelfId();
	const result = await _getNewsCount(userId, "UNEXPORTED");
	if (result.isFailure) {
		throw result.error;
	}
	return result.value;
});

export const getExportedNewsCount: GetNewsCount = cache(async () => {
	const userId = await getSelfId();
	const result = await _getNewsCount(userId, "EXPORTED");
	if (result.isFailure) {
		throw result.error;
	}
	return result.value;
});

export type GetNews = (_: number) => Promise<LinkCardStackInitialData>;

export const getUnexportedNews: GetNews = cache(
	async (currentCount: number) => {
		const userId = await getSelfId();
		return _getNews(currentCount, userId, "UNEXPORTED");
	},
);

export const getExportedNews: GetNews = cache(async (currentCount: number) => {
	const userId = await getSelfId();
	return _getNews(currentCount, userId, "EXPORTED", {
		ttl: 400,
		swr: 40,
		tags: [`${sanitizeCacheTag(userId)}_news_${currentCount}`],
	});
});

export const getCategories = cache(async (): Promise<NewsFormClientData> => {
	const userId = await getSelfId();
	return _getCategories(userId);
});
