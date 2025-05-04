import { PAGE_SIZE } from "@/constants";
import prisma from "@/prisma";
import { cache } from "react";

const _getStaticNews = async (page: number) => {
	return await prisma.staticNews.findMany({
		select: { id: true, title: true, url: true, quote: true },
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
