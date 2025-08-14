import { cache } from "react";
import { LinkCardData } from "@/components/card/link-card";
import { PAGE_SIZE } from "@/constants";
import type { Status } from "@/features/types";
import { getSelfId } from "@/utils/auth/session";
import { getDomainFromUrl } from "@/utils/validate-url";
import type { NewsFormClientData } from "../components/client/news-form-client";
import {
	categoryQueryRepository,
	newsQueryRepository,
} from "../repositories/news-query-repository";

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
			id: d.categoryName,
			badgeText: getDomainFromUrl(d.url),
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
			id: d.categoryName,
			badgeText: getDomainFromUrl(d.url),
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
	return response.map((d) => ({ id: d.categoryId, name: d.categoryName }));
});
