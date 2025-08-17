import { unstable_cache } from "next/cache";
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

const _getExportedNews = async (page: number): Promise<LinkCardData[]> => {
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
};

export const getExportedNews = unstable_cache(
	_getExportedNews,
	["news-exported"],
	{ tags: ["news-exported"], revalidate: 400 },
);

const _getUnexportedNews = async (page: number): Promise<LinkCardData[]> => {
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
};

export const getUnexportedNews = unstable_cache(
	_getUnexportedNews,
	["news-unexported"],
	{ tags: ["news-unexported"], revalidate: 300 },
);

const _getNewsCount = async (
	status: Status,
): Promise<{ count: number; pageSize: number }> => {
	try {
		const userId = await getSelfId();
		return {
			count: await newsQueryRepository.count(userId, status),
			pageSize: PAGE_SIZE,
		};
	} catch (error) {
		throw error;
	}
};

export const getNewsCount = (status: Status) =>
	unstable_cache(() => _getNewsCount(status), [`news-count-${status}`], {
		tags: [`news-count-${status}`],
		revalidate: 60,
	})();

const _getCategories = async (): Promise<NewsFormClientData> => {
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
};

export const getCategories = () =>
	unstable_cache(() => _getCategories(), ["categories"], {
		tags: ["categories"],
		revalidate: 60,
	})();
