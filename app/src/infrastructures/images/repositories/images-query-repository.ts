import type { Status } from "@s-hirano-ist/s-core/common/entities/common-entity";
import type { IImagesQueryRepository } from "@s-hirano-ist/s-core/images/repositories/images-query-repository.interface";
import type { ImagesFindManyParams } from "@s-hirano-ist/s-core/images/types/query-params";
import prisma from "@/prisma";

async function findByPath(
	path: string,
	userId: string,
): Promise<{
	id: string;
	path: string;
	contentType: string;
	fileSize: number | null;
	width: number | null;
	height: number | null;
	tags: string[];
	status: string;
	description: string | null;
} | null> {
	const data = await prisma.image.findUnique({
		where: { path_userId: { path, userId } },
		select: {
			id: true,
			path: true,
			contentType: true,
			fileSize: true,
			width: true,
			height: true,
			tags: true,
			status: true,
			description: true,
		},
	});
	return data;
}

async function findMany(
	userId: string,
	status: Status,
	params?: ImagesFindManyParams,
): Promise<
	{ id: string; path: string; height: number | null; width: number | null }[]
> {
	const data = await prisma.image.findMany({
		where: { userId, status },
		select: {
			id: true,
			path: true,
			width: true,
			height: true,
		},
		...params,
	});
	return data;
}

async function count(userId: string, status: Status): Promise<number> {
	const data = await prisma.image.count({ where: { userId, status } });
	return data;
}

export const imagesQueryRepository: IImagesQueryRepository = {
	findByPath,
	findMany,
	count,
};
