import { cache } from "react";
import type { StaticContents } from "@/generated";
import prisma from "@/prisma";

export type IStaticContentsRepository = {
	findAll(): Promise<StaticContentsWithImage[]>;
	count(): Promise<number>;
};

type StaticContentsWithImage = {
	title: string;
	href: string;
	image: Uint8Array;
};

export class StaticContentsRepository implements IStaticContentsRepository {
	private _findAll = async (): Promise<StaticContentsWithImage[]> => {
		const contents = await prisma.staticContents.findMany({
			select: { title: true, uint8ArrayImage: true },
			cacheStrategy: { ttl: 400, tags: ["staticContents"] },
		});

		return contents.map((content) => ({
			title: content.title,
			href: content.title,
			image: content.uint8ArrayImage || new Uint8Array(),
		}));
	};

	private _count = async (): Promise<number> => {
		return await prisma.staticContents.count({});
	};

	findAll = cache(this._findAll);
	count = cache(this._count);
}

export const staticContentsRepository = new StaticContentsRepository();
