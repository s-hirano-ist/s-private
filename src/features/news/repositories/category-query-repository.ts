import type { Prisma } from "@/generated";
import prisma from "@/prisma";

type ICategoryQueryRepository = {
	findById(name: string, userId: string): Promise<Categories | null>;
	findMany(
		userId: string,
		params?: CategoryFindManyParams,
	): Promise<Categories[]>;
};

type Categories = {
	id: number;
	name: string;
};

type CategoryFindManyParams = {
	orderBy?: Prisma.CategoriesOrderByWithRelationInput;
	take?: number;
	skip?: number;
};

class CategoryQueryRepository implements ICategoryQueryRepository {
	async findById(name: string, userId: string): Promise<Categories | null> {
		return await prisma.categories.findUnique({
			where: { name_userId: { name, userId } },
		});
	}

	async findMany(
		userId: string,
		params?: CategoryFindManyParams,
	): Promise<Categories[]> {
		return await prisma.categories.findMany({
			where: { userId },
			select: { id: true, name: true },
			...params,
		});
	}
}

export const categoryQueryRepository = new CategoryQueryRepository();
