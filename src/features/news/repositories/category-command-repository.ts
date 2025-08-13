import type { Categories } from "@/generated";
import prisma from "@/prisma";

type ICategoryCommandRepository = {
	upsert(data: CategoryUpsertInput): Promise<Categories>;
	deleteById(id: number, userId: string): Promise<void>;
};

type CategoryUpsertInput = {
	name: string;
	userId: string;
};

class CategoryCommandRepository implements ICategoryCommandRepository {
	async upsert(data: CategoryUpsertInput): Promise<Categories> {
		return await prisma.categories.upsert({
			where: { name_userId: { userId: data.userId, name: data.name } },
			update: {},
			create: data,
		});
	}

	async deleteById(id: number, userId: string): Promise<void> {
		await prisma.categories.delete({
			where: { id, userId },
		});
	}
}

export const categoryCommandRepository = new CategoryCommandRepository();
