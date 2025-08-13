import { cache } from "react";
import { categoryQueryRepository } from "@/features/news/repositories/category-query-repository";
import { newsQueryRepository } from "@/features/news/repositories/news-query-repository";
import { getSelfId } from "@/utils/auth/session";

export const getNews = cache(newsQueryRepository.findExportedMany);

export const getNewsCount = cache(newsQueryRepository.count);

export const getUnexportedNewsByUserId = cache(async () => {
	const userId = await getSelfId();
	const news = await newsQueryRepository.findByStatusAndUserIdWithCategory(
		"UNEXPORTED",
		userId,
	);

	return news.map((d) => ({
		id: d.id,
		title: d.title,
		description: d.quote ?? undefined,
		href: d.url,
		badgeText: d.Category.name,
	}));
});

export const getCategoriesByUserId = cache(async () => {
	const userId = await getSelfId();
	return await categoryQueryRepository.findByUserId(userId);
});
