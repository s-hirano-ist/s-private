import type { Status } from "@/domains/common/entities/common-entity";
import type { IImagesQueryRepository } from "@/domains/images/repositories/images-query-repository.interface";
import type { ImagesFindManyParams } from "@/domains/images/types/query-params";
import { env } from "@/env";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { ORIGINAL_IMAGE_PATH, THUMBNAIL_IMAGE_PATH } from "./common";

class ImagesQueryRepository implements IImagesQueryRepository {
	async findByPath(path: string, userId: string): Promise<{} | null> {
		return await prisma.images.findUnique({
			where: { path_userId: { path, userId } },
			select: {},
		});
	}

	async findMany(
		userId: string,
		status: Status,
		params?: ImagesFindManyParams,
	): Promise<
		{ id: string; path: string; height: number | null; width: number | null }[]
	> {
		return await prisma.images.findMany({
			where: { userId, status },
			select: {
				id: true,
				path: true,
				width: true,
				height: true,
			},
			...params,
		});
	}

	async count(userId: string, status: Status): Promise<number> {
		return await prisma.images.count({ where: { userId, status } });
	}

	async getFromStorage(
		path: string,
		isThumbnail: boolean,
	): Promise<NodeJS.ReadableStream> {
		const objKey = `${isThumbnail ? THUMBNAIL_IMAGE_PATH : ORIGINAL_IMAGE_PATH}/${path}`;

		return await minioClient.getObject(env.MINIO_BUCKET_NAME, objKey);
	}
}

export const imagesQueryRepository = new ImagesQueryRepository();
