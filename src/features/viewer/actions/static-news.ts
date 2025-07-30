import { cache } from "react";
import { PAGE_SIZE } from "@/constants";
import prisma from "@/prisma";

const _getStaticNews = async (page: number) => {
	return await prisma.staticNews.findMany({
		select: {
			id: true,
			title: true,
			url: true,
			quote: true,
			ogImageUrl: true,
			ogTitle: true,
			ogDescription: true,
		},
		skip: (page - 1) * PAGE_SIZE,
		take: PAGE_SIZE,
		cacheStrategy: { ttl: 400, swr: 40, tags: ["staticNews"] },
	});
};

export const getStaticNews = cache(_getStaticNews);

const _getStaticNewsCount = async () => {
	return await prisma.staticNews.count({});
};

export const getStaticNewsCount = cache(_getStaticNewsCount);
