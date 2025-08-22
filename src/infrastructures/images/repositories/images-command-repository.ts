import type { Status } from "@/domains/common/entities/common-entity";
import type { Image, Path } from "@/domains/images/entities/image-entity";
import { ImageCreatedEvent } from "@/domains/images/events/image-created-event";
import { ImageDeletedEvent } from "@/domains/images/events/image-deleted-event";
import type { IImagesCommandRepository } from "@/domains/images/repositories/images-command-repository.interface";
import { env } from "@/env";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { ORIGINAL_IMAGE_PATH, THUMBNAIL_IMAGE_PATH } from "./common";

initializeEventHandlers();

async function create(data: Image): Promise<void> {
	const response = await prisma.image.create({ data });
	await eventDispatcher.dispatch(
		new ImageCreatedEvent({
			id: response.id,
			userId: response.userId,
			caller: "addImage",
		}),
	);
}

async function uploadToStorage(
	path: Path,
	buffer: Buffer,
	isThumbnail: boolean,
): Promise<void> {
	const objKey = `${isThumbnail ? THUMBNAIL_IMAGE_PATH : ORIGINAL_IMAGE_PATH}/${path}`;
	await minioClient.putObject(env.MINIO_BUCKET_NAME, objKey, buffer);
}

async function deleteById(
	id: string,
	userId: string,
	status: Status,
): Promise<void> {
	const data = await prisma.image.delete({
		where: { id, userId, status },
		select: { path: true },
	});
	await eventDispatcher.dispatch(
		new ImageDeletedEvent({
			path: data.path,
			userId,
			caller: "deleteImage",
		}),
	);
}

export const imagesCommandRepository: IImagesCommandRepository = {
	create,
	uploadToStorage,
	deleteById,
};
