import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import type { GetCount, GetPaginatedData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import type { NewsFormClientData } from "@/components/news/client/news-form-client";
import {
	makeStatus,
	type Status,
} from "@/domains/common/entities/common-entity";
import type { CacheStrategy } from "@/domains/news/types";
import {
	categoryQueryRepository,
	newsQueryRepository,
} from "@/infrastructures/news/repositories/news-query-repository";
import { serverLogger } from "@/infrastructures/observability/server";

export const _getNews = async (
	currentCount: number,
	userId: string,
	status: Status,
	cacheStrategy?: CacheStrategy,
): Promise<LinkCardStackInitialData> => {
	"use cache";
	cacheTag(
		`news_${status}_${userId}`,
		`news_${status}_${userId}_${currentCount}`,
	);
	try {
		const news = await newsQueryRepository.findMany(userId, status, {
			skip: currentCount,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
			cacheStrategy,
		});

		const totalCount = await _getNewsCount(userId, status);

		return {
			data: news.map((d) => ({
				id: d.id,
				primaryBadgeText: d.category.name,
				secondaryBadgeText: new URL(d.url).hostname,
				key: d.id,
				title: d.title,
				description:
					`${d.quote} \n ${d.ogTitle} \n ${d.ogDescription}`.slice(0, 200) +
					"...",
				href: d.url,
			})),
			totalCount,
		};
	} catch (error) {
		throw error;
	}
};

const _getNewsCount = async (
	userId: string,
	status: Status,
): Promise<number> => {
	"use cache";
	cacheTag(`news_count_${status}_${userId}`);
	try {
		return await newsQueryRepository.count(userId, status);
	} catch (error) {
		throw error;
	}
};

const _getCategories = async (userId: string): Promise<NewsFormClientData> => {
	"use cache";
	cacheTag("categories", `categories_${userId}`);
	try {
		const response = await categoryQueryRepository.findMany(userId, {
			orderBy: { name: "asc" },
		});
		return response;
	} catch (error) {
		serverLogger.error(
			"unexpected",
			{ caller: "AddNewsFormCategory", status: 500 },
			error,
		);
		// not critical for viewer nor dumper
		return [];
	}
};

export const getUnexportedNewsCount: GetCount = cache(async () => {
	const userId = await getSelfId();
	return _getNewsCount(userId, makeStatus("UNEXPORTED"));
});

export const getExportedNewsCount: GetCount = cache(async () => {
	const userId = await getSelfId();
	return _getNewsCount(userId, makeStatus("EXPORTED"));
});

export const getUnexportedNews: GetPaginatedData<LinkCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getNews(currentCount, userId, makeStatus("UNEXPORTED"));
	});

export const getExportedNews: GetPaginatedData<LinkCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getNews(currentCount, userId, makeStatus("EXPORTED"), {
			ttl: 400,
			swr: 40,
			tags: [`${sanitizeCacheTag(userId)}_news_${currentCount}`],
		});
	});

export const getCategories = cache(async (): Promise<NewsFormClientData> => {
	const userId = await getSelfId();
	return _getCategories(userId);
});
