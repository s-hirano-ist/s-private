import type { Categories } from "@/generated";
import prisma from "@/prisma";

export type ICategoryCommandRepository = {
	upsert(data: CategoryUpsertInput): Promise<Categories>;
	delete(id: number): Promise<void>;
};

type CategoryUpsertInput = {
	name: string;
	userId: string;
};

export class CategoryCommandRepository implements ICategoryCommandRepository {
	async upsert(data: CategoryUpsertInput): Promise<Categories> {
		return await prisma.categories.upsert({
			where: {
				name_userId: {
					userId: data.userId,
					name: data.name,
				},
			},
			update: {},
			create: data,
		});
	}

	async delete(id: number): Promise<void> {
		await prisma.categories.delete({
			where: { id },
		});
	}
}

export const categoryCommandRepository = new CategoryCommandRepository();
