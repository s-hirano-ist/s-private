import { PrismaCacheStrategy } from "@prisma/extension-accelerate";
import { env } from "@/env";
import type { Prisma, Status } from "@/generated";
import { minioClient } from "@/minio";
import prisma from "@/prisma";

type IImageQueryRepository = {
	findMany(
		userId: string,
		status: Status,
		params?: ImageFindManyParams,
	): Promise<Images[]>;
	count(userId: string, status: Status): Promise<number>;
	getFromStorage(path: string): Promise<NodeJS.ReadableStream>;
};

export type Images = {
	paths: string;
};

type ImageFindManyParams = {
	orderBy?: Prisma.ImagesOrderByWithRelationInput;
	take?: number;
	skip?: number;
	cacheStrategy?: PrismaCacheStrategy["cacheStrategy"];
};

class ImageQueryRepository implements IImageQueryRepository {
	async findMany(
		userId: string,
		status: Status,
		params?: ImageFindManyParams,
	): Promise<Images[]> {
		return await prisma.images.findMany({
			where: { userId, status },
			select: { paths: true },
			...params,
		});
	}

	async count(userId: string, status: Status): Promise<number> {
		return await prisma.images.count({ where: { userId, status } });
	}

	async getFromStorage(path: string): Promise<NodeJS.ReadableStream> {
		return await minioClient.getObject(env.MINIO_BUCKET_NAME, path);
	}
}

export const imageQueryRepository = new ImageQueryRepository();
