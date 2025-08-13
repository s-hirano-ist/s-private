import { cache } from "react";
import { LinkCardData } from "@/components/card/link-card";
import { PAGE_SIZE } from "@/constants";
import { categoryQueryRepository } from "@/features/news/repositories/category-query-repository";
import { newsQueryRepository } from "@/features/news/repositories/news-query-repository";
import { Status } from "@/generated";
import { getSelfId } from "@/utils/auth/session";

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
			title: d.title,
			description: `${d.quote} \n ${d.ogTitle} \n ${d.ogDescription}`,
			href: d.url,
			badgeText: d.Category.name,
		}));
	},
);

export const getUnexportedNews = cache(async (): Promise<LinkCardData[]> => {
	const userId = await getSelfId();
	const news = await newsQueryRepository.findMany(userId, "UNEXPORTED", {
		orderBy: { createdAt: "desc" },
	});

	return news.map((d) => ({
		id: d.id,
		title: d.title,
		description: d.quote ?? undefined,
		href: d.url,
		badgeText: d.Category.name,
	}));
});

export const getNewsCount = cache(async (status: Status) => {
	const userId = await getSelfId();
	return await newsQueryRepository.count(userId, status);
});

export const getCategoriesByUserId = cache(async () => {
	const userId = await getSelfId();
	return await categoryQueryRepository.findMany(userId, {
		orderBy: { name: "asc" },
	});
});
