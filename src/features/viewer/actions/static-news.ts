import { cache } from "react";
import { PAGE_SIZE } from "@/constants";
import db from "@/db";
import { staticNews } from "@/db/schema";
import { count } from "drizzle-orm";

const _getStaticNews = async (page: number) => {
	return await db
		.select({
			id: staticNews.id,
			title: staticNews.title,
			url: staticNews.url,
			quote: staticNews.quote,
			ogImageUrl: staticNews.ogImageUrl,
			ogTitle: staticNews.ogTitle,
			ogDescription: staticNews.ogDescription,
		})
		.from(staticNews)
		.limit(PAGE_SIZE)
		.offset((page - 1) * PAGE_SIZE);
};

export const getStaticNews = cache(_getStaticNews);

const _getStaticNewsCount = async () => {
	const [result] = await db
		.select({ count: count() })
		.from(staticNews);
	return result.count;
};

export const getStaticNewsCount = cache(_getStaticNewsCount);
