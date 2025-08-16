import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { LinkCardData } from "@/common/components/card/link-card";
import { PAGE_SIZE } from "@/common/constants";
import type { Status } from "@/domains/common/entities/common-entity";
import type { NewsFormClientData } from "@/features/news/components/client/news-form-client";
import {
	categoryQueryRepository,
	newsQueryRepository,
} from "@/infrastructures/news/repositories/news-query-repository";

export const getExportedNews = cache(
	async (page: number): Promise<LinkCardData[]> => {
		const userId = await getSelfId();
		const news = await newsQueryRepository.findMany(userId, "EXPORTED", {
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
			cacheStrategy: { ttl: 400, swr: 40, tags: ["news"] },
		});

		return news.map((d) => ({
			id: d.id,
			primaryBadgeText: d.category.name,
			secondaryBadgeText: new URL(d.url).hostname,
			key: d.id,
			title: d.title,
			description: `${d.quote} \n ${d.ogTitle} \n ${d.ogDescription}`,
			href: d.url,
		}));
	},
);

export const getUnexportedNews = cache(
	async (page: number): Promise<LinkCardData[]> => {
		const userId = await getSelfId();
		const news = await newsQueryRepository.findMany(userId, "UNEXPORTED", {
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
		});

		return news.map((d) => ({
			id: d.id,
			primaryBadgeText: d.category.name,
			secondaryBadgeText: new URL(d.url).hostname,
			key: d.id,
			title: d.title,
			description: d.quote ?? undefined,
			href: d.url,
		}));
	},
);

export const getNewsCount = cache(async (status: Status) => {
	const userId = await getSelfId();
	return await newsQueryRepository.count(userId, status);
});

export const getCategories = cache(async (): Promise<NewsFormClientData> => {
	const userId = await getSelfId();
	const response = await categoryQueryRepository.findMany(userId, {
		orderBy: { name: "asc" },
	});
	return response;
});
