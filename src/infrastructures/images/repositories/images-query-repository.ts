import { ImagesQueryData } from "@/domains/images/entities/images-entity";
import {
	IImagesQueryRepository,
	ImagesFindManyParams,
} from "@/domains/images/types";
import { env } from "@/env";
import type { Status } from "@/generated";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { ORIGINAL_IMAGE_PATH, THUMBNAIL_IMAGE_PATH } from "./common";

class ImagesQueryRepository implements IImagesQueryRepository {
	async findMany(
		userId: string,
		status: Status,
		params?: ImagesFindManyParams,
	): Promise<ImagesQueryData[]> {
		const response = await prisma.images.findMany({
			where: { userId, status },
			select: { path: true, id: true },
			...params,
		});
		return response;
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
