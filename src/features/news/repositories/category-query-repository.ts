import type { Categories, Prisma } from "@/generated";
import prisma from "@/prisma";

export type ICategoryQueryRepository = {
	findById(id: number): Promise<Categories | null>;
	findByNameAndUserId(name: string, userId: string): Promise<Categories | null>;
	findMany(params?: CategoryFindManyParams): Promise<Categories[]>;
	findByUserId(userId: string): Promise<Categories[]>;
};

type CategoryFindManyParams = {
	where?: Prisma.CategoriesWhereInput;
	orderBy?: Prisma.CategoriesOrderByWithRelationInput;
	take?: number;
	skip?: number;
};

export class CategoryQueryRepository implements ICategoryQueryRepository {
	async findById(id: number): Promise<Categories | null> {
		return await prisma.categories.findUnique({
			where: { id },
		});
	}

	async findByNameAndUserId(
		name: string,
		userId: string,
	): Promise<Categories | null> {
		return await prisma.categories.findUnique({
			where: {
				name_userId: {
					name,
					userId,
				},
			},
		});
	}

	async findMany(params?: CategoryFindManyParams): Promise<Categories[]> {
		return await prisma.categories.findMany(params);
	}

	async findByUserId(userId: string): Promise<Categories[]> {
		return await prisma.categories.findMany({
			where: { userId },
			orderBy: { name: "asc" },
		});
	}
}

export const categoryQueryRepository = new CategoryQueryRepository();
