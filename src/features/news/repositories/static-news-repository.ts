import { cache } from "react";
import { PAGE_SIZE } from "@/constants";
import prisma from "@/prisma";

export type IStaticNewsRepository = {
	findMany(page: number): Promise<StaticNewsWithCategory[]>;
	count(): Promise<number>;
};

type StaticNewsWithCategory = {
	id: number;
	url: string;
	title: string;
	quote: string | null;
	ogImageUrl: string | null;
	ogTitle: string | null;
	ogDescription: string | null;
};

export class StaticNewsRepository implements IStaticNewsRepository {
	private _findMany = async (
		page: number,
	): Promise<StaticNewsWithCategory[]> => {
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

	private _count = async (): Promise<number> => {
		return await prisma.staticNews.count({});
	};

	findMany = cache(this._findMany);
	count = cache(this._count);
}

export const staticNewsRepository = new StaticNewsRepository();
