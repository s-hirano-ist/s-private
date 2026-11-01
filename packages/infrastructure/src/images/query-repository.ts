import type { IImagesQueryRepository } from "@s-hirano-ist/s-core/images/repositories/images-query-repository.interface";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
export function createImagesQueryRepository(
	prisma: Pick<DatabaseClient, "image">,
): IImagesQueryRepository {
	return {
		async existsByPath(path, userId) {
			return (
				(await prisma.image.findUnique({
					where: { path_userId: { path, userId } },
					select: { id: true },
				})) !== null
			);
		},
	};
}
