import type { Status } from "@s-hirano-ist/s-core/common/entities/common-entity";
import type { UnexportedImage } from "@s-hirano-ist/s-core/images/entities/image-entity";
import type {
	DeleteImageResult,
	IImagesCommandRepository,
} from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import prisma from "@/prisma";

async function create(data: UnexportedImage): Promise<void> {
	await prisma.image.create({
		data,
	});
}

async function deleteById(
	id: string,
	userId: string,
	status: Status,
): Promise<DeleteImageResult> {
	const data = await prisma.image.delete({
		where: { id, userId, status },
		select: { path: true },
	});
	return { path: data.path };
}

export const imagesCommandRepository: IImagesCommandRepository = {
	create,
	deleteById,
};
