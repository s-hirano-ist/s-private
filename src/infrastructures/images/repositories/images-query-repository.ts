import type { Status } from "@/domains/common/entities/common-entity";
import type { ImagesQueryData } from "@/domains/images/entities/images-entity";
import type {
	IImagesQueryRepository,
	ImagesFindManyParams,
} from "@/domains/images/types";
import { env } from "@/env";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { ORIGINAL_IMAGE_PATH, THUMBNAIL_IMAGE_PATH } from "./common";

class ImagesQueryRepository implements IImagesQueryRepository {
	async findByPath(
		path: string,
		userId: string,
	): Promise<ImagesQueryData | null> {
		const result = await prisma.images.findUnique({
			where: { path_userId: { path, userId } },
		});
		return result;
	}

	async findMany(
		userId: string,
		status: Status,
		params?: ImagesFindManyParams,
	): Promise<ImagesQueryData[]> {
		const response = await prisma.images.findMany({
			where: { userId, status },
			select: {
				id: true,
				path: true,
				width: true,
				height: true,
				fileSize: true,
				tags: true,
				description: true,
			},
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
