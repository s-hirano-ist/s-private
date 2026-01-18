import type { Status } from "@s-hirano-ist/s-core/common/entities/common-entity";
import type { UnexportedImage } from "@s-hirano-ist/s-core/images/entities/image-entity";
import { ImageCreatedEvent } from "@s-hirano-ist/s-core/images/events/image-created-event";
import { ImageDeletedEvent } from "@s-hirano-ist/s-core/images/events/image-deleted-event";
import type { IImagesCommandRepository } from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import prisma from "@/prisma";

initializeEventHandlers();

async function create(data: UnexportedImage): Promise<void> {
	const response = await prisma.image.create({
		data,
		select: { id: true, userId: true, path: true },
	});
	await eventDispatcher.dispatch(
		new ImageCreatedEvent({
			id: response.id,
			userId: response.userId,
			caller: "addImage",
		}),
	);
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
	deleteById,
};
