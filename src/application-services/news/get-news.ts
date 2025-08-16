import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import { LinkCardData } from "@/components/common/layouts/cards/link-card";
import type { NewsFormClientData } from "@/components/news/client/news-form-client";
import type { Status } from "@/domains/common/entities/common-entity";
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

export const getNewsCount = cache(
	async (status: Status): Promise<{ count: number; pageSize: number }> => {
		const userId = await getSelfId();
		return {
			count: await newsQueryRepository.count(userId, status),
			pageSize: PAGE_SIZE,
		};
	},
);

export const getCategories = cache(async (): Promise<NewsFormClientData> => {
	const userId = await getSelfId();
	const response = await categoryQueryRepository.findMany(userId, {
		orderBy: { name: "asc" },
	});
	return response;
});
