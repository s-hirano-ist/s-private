import type { ICategoryCommandRepository } from "@s-hirano-ist/s-core/articles/repositories/category-command-repository.interface";
import prisma from "@/prisma";
import { createCategoryCommandRepository } from "@s-hirano-ist/s-backend/articles/category-command-repository";
import { revalidateTag } from "next/cache";
const repository = createCategoryCommandRepository(prisma);
export const categoryCommandRepository: ICategoryCommandRepository = {
	async create(data) {
		await repository.create(data);
		revalidateTag("categories", { expire: 0 });
	},
};
