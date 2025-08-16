import { Status } from "@/domains/common/entities/common-entity";
import { ImagesFormSchema } from "@/domains/images/entities/images-entity";
import type { IImagesCommandRepository } from "@/domains/images/types";
import { env } from "@/env";
import { serverLogger } from "@/infrastructures/observability/server";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { ORIGINAL_IMAGE_PATH, THUMBNAIL_IMAGE_PATH } from "./common";

class ImagesCommandRepository implements IImagesCommandRepository {
	async create(data: ImagesFormSchema): Promise<void> {
		const response = await prisma.images.create({ data });
		serverLogger.info(
			`【IMAGE】\n\nコンテンツ\nfileName: ${response.id}\nの登録ができました`,
			{ caller: "addImage", status: 201, userId: response.userId },
			{ notify: true },
		);
	}

	async uploadToStorage(
		path: string,
		buffer: Buffer,
		isThumbnail: boolean,
	): Promise<void> {
		const objKey = `${isThumbnail ? THUMBNAIL_IMAGE_PATH : ORIGINAL_IMAGE_PATH}/${path}`;
		await minioClient.putObject(env.MINIO_BUCKET_NAME, objKey, buffer);
	}

	async deleteById(id: string, userId: string, status: Status): Promise<void> {
		const data = await prisma.images.delete({
			where: { id, userId, status },
			select: { path: true },
		});
		serverLogger.info(
			`【IMAGE】\n\n削除\npath: ${data.path}`,
			{ caller: "deleteImages", status: 200, userId },
			{ notify: true },
		);
	}
}

export const imagesCommandRepository = new ImagesCommandRepository();
