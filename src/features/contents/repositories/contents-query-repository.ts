import { PrismaCacheStrategy } from "@prisma/extension-accelerate";
import type { Prisma, Status } from "@/generated";
import prisma from "@/prisma";

type IContentsQueryRepository = {
	findByTitle(
		title: string,
		userId: string,
		status: Status,
	): Promise<Contents | null>;
	findMany(
		userId: string,
		status: Status,
		params?: ContentsFindManyParams,
	): Promise<ContentsList>;
	count(userId: string, status: Status): Promise<number>;
};

type Contents = {
	id: string;
	title: string;
	markdown: string;
};

type ContentsList = {
	id: string;
	title: string;
}[];

type ContentsFindManyParams = {
	orderBy?: Prisma.ContentsOrderByWithRelationInput;
	take?: number;
	skip?: number;
	cacheStrategy?: PrismaCacheStrategy["cacheStrategy"];
};

class ContentsQueryRepository implements IContentsQueryRepository {
	async findByTitle(
		title: string,
		userId: string,
		status: Status,
	): Promise<Contents | null> {
		return await prisma.contents.findUnique({
			where: { status, title_userId: { title, userId } },
			select: { id: true, title: true, markdown: true },
		});
	}

	async findMany(
		userId: string,
		status: Status,
		params?: ContentsFindManyParams,
	): Promise<ContentsList> {
		return await prisma.contents.findMany({
			where: { userId, status },
			select: { id: true, title: true },
			...params,
		});
	}

	async count(userId: string, status: Status): Promise<number> {
		return await prisma.contents.count({ where: { userId, status } });
	}
}

export const contentsQueryRepository = new ContentsQueryRepository();
