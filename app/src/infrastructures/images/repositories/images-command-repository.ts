import type { UnexportedImage } from "@s-hirano-ist/s-core/images/entities/image-entity";
import type {
	DeleteImageResult,
	IImagesCommandRepository,
} from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { revalidateTag } from "next/cache";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/infrastructures/common/cache/cache-tag-builder";
import prisma from "@/prisma";

async function create(data: UnexportedImage): Promise<void> {
	await prisma.image.create({
		data,
	});

	revalidateTag(buildContentCacheTag("images", data.status, data.userId));
	revalidateTag(buildCountCacheTag("images", data.status, data.userId));
}

async function deleteById(
	id: Id,
	userId: UserId,
	status: Status,
): Promise<DeleteImageResult> {
	const data = await prisma.image.delete({
		where: { id, userId, status },
		select: { path: true },
	});

	revalidateTag(buildContentCacheTag("images", status, userId));
	revalidateTag(buildCountCacheTag("images", status, userId));

	return { path: data.path };
}

export const imagesCommandRepository: IImagesCommandRepository = {
	create,
	deleteById,
};
