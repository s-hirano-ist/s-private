import type { IArticlesCommandRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import prisma from "@/prisma";
import { createArticlesCommandRepository } from "@s-hirano-ist/s-backend/articles/command-repository";
import { revalidateTag } from "next/cache";

const repository = createArticlesCommandRepository(prisma);
/** Temporary Web cache adapter; persistence belongs to the backend. */
export const articlesCommandRepository: IArticlesCommandRepository = {
	async create(data) {
		await repository.create(data);
		revalidateTag(buildContentCacheTag("articles", data.status, data.userId), {
			expire: 0,
		});
		revalidateTag(buildCountCacheTag("articles", data.status, data.userId), {
			expire: 0,
		});
		revalidateTag("categories", { expire: 0 });
	},
	async deleteById(id, userId, status) {
		const result = await repository.deleteById(id, userId, status);
		revalidateTag(buildContentCacheTag("articles", status, userId), {
			expire: 0,
		});
		revalidateTag(buildCountCacheTag("articles", status, userId), {
			expire: 0,
		});
		return result;
	},
};
