import type {
	CategoryCreateData,
	ICategoryCommandRepository,
} from "@s-hirano-ist/s-core/articles/repositories/category-command-repository.interface";
import { updateTag } from "next/cache";
import prisma from "@/prisma";

async function create(data: CategoryCreateData): Promise<void> {
	await prisma.category.create({
		data: {
			id: data.id,
			name: data.name,
			userId: data.userId,
			createdAt: data.createdAt,
		},
	});

	updateTag("categories");
}

export const categoryCommandRepository: ICategoryCommandRepository = {
	create,
};
