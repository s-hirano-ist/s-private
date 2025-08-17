import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import type { LinkCardData } from "@/components/common/layouts/cards/link-card";
import type { NewsFormClientData } from "@/components/news/client/news-form-client";
import type { Status } from "@/domains/common/entities/common-entity";
import {
	categoryQueryRepository,
	newsQueryRepository,
} from "@/infrastructures/news/repositories/news-query-repository";
import { serverLogger } from "@/infrastructures/observability/server";

export const getExportedNews = cache(
	async (page: number): Promise<LinkCardData[]> => {
		try {
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
				description:
					`${d.quote} \n ${d.ogTitle} \n ${d.ogDescription}`.slice(0, 200) +
					"...",
				href: d.url,
			}));
		} catch (error) {
			throw error;
		}
	},
);

export const getUnexportedNews = cache(
	async (page: number): Promise<LinkCardData[]> => {
		try {
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
		} catch (error) {
			throw error;
		}
	},
);

export const getNewsCount = cache(
	async (status: Status): Promise<{ count: number; pageSize: number }> => {
		try {
			const userId = await getSelfId();
			return {
				count: await newsQueryRepository.count(userId, status),
				pageSize: PAGE_SIZE,
			};
		} catch (error) {
			throw error;
		}
	},
);

export const getCategories = cache(async (): Promise<NewsFormClientData> => {
	try {
		const userId = await getSelfId();
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
});
