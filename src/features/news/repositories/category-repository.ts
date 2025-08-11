import type { Categories, Prisma } from "@/generated";
import prisma from "@/prisma";

export type ICategoryRepository = {
	upsert(data: CategoryUpsertInput): Promise<Categories>;
	findById(id: number): Promise<Categories | null>;
	findByNameAndUserId(name: string, userId: string): Promise<Categories | null>;
	findMany(params?: CategoryFindManyParams): Promise<Categories[]>;
	delete(id: number): Promise<void>;
};

type CategoryUpsertInput = {
	name: string;
	userId: string;
};

type CategoryFindManyParams = {
	where?: Prisma.CategoriesWhereInput;
	orderBy?: Prisma.CategoriesOrderByWithRelationInput;
	take?: number;
	skip?: number;
};

export class CategoryRepository implements ICategoryRepository {
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

	async delete(id: number): Promise<void> {
		await prisma.categories.delete({
			where: { id },
		});
	}
}

export const categoryRepository = new CategoryRepository();
