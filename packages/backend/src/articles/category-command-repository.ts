import type { DatabaseClient } from "@s-hirano-ist/s-backend/shared/database";
import type {
	CategoryCreateData,
	ICategoryCommandRepository,
} from "@s-hirano-ist/s-core/articles/repositories/category-command-repository.interface";

export function createCategoryCommandRepository(
	prisma: Pick<DatabaseClient, "category">,
) {
	async function create(data: CategoryCreateData): Promise<void> {
		await prisma.category.create({
			data: {
				id: data.id,
				name: data.name,
				userId: data.userId,
				createdAt: data.createdAt,
			},
		});
	}

	const categoryCommandRepository: ICategoryCommandRepository = {
		create,
	};

	return categoryCommandRepository;
}
