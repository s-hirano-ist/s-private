import type { Status } from "@/domains/common/entities/common-entity";
import type { IImagesQueryRepository } from "@/domains/images/repositories/images-query-repository.interface";
import type { ImagesFindManyParams } from "@/domains/images/types/query-params";
import { env } from "@/env";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { ORIGINAL_IMAGE_PATH, THUMBNAIL_IMAGE_PATH } from "./common";

class ImagesQueryRepository implements IImagesQueryRepository {
	async findByPath(path: string, userId: string): Promise<{} | null> {
		const data = await prisma.image.findUnique({
			where: { path_userId: { path, userId } },
			select: {},
		});
		return data;
	}

	async findMany(
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

	async count(userId: string, status: Status): Promise<number> {
		const data = await prisma.image.count({ where: { userId, status } });
		return data;
	}

	async getFromStorage(
		path: string,
		isThumbnail: boolean,
	): Promise<NodeJS.ReadableStream> {
		const objKey = `${isThumbnail ? THUMBNAIL_IMAGE_PATH : ORIGINAL_IMAGE_PATH}/${path}`;

		const data = await minioClient.getObject(env.MINIO_BUCKET_NAME, objKey);
		return data;
	}
}

export const imagesQueryRepository = new ImagesQueryRepository();
