import type { IImagesCommandRepository } from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import prisma from "@/prisma";
import { createImagesCommandRepository } from "@s-hirano-ist/s-backend/images/command-repository";
import { revalidateTag } from "next/cache";

const repository = createImagesCommandRepository(prisma);
/** Temporary Web cache adapter; persistence belongs to the backend. */
export const imagesCommandRepository: IImagesCommandRepository = {
	async create(data) {
		await repository.create(data);
		revalidateTag(buildContentCacheTag("images", data.status, data.userId), {
			expire: 0,
		});
		revalidateTag(buildCountCacheTag("images", data.status, data.userId), {
			expire: 0,
		});
	},
	async deleteById(id, userId, status) {
		const result = await repository.deleteById(id, userId, status);
		revalidateTag(buildContentCacheTag("images", status, userId), {
			expire: 0,
		});
		revalidateTag(buildCountCacheTag("images", status, userId), { expire: 0 });
		return result;
	},
};
