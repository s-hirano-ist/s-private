import type { UnexportedImage } from "@s-hirano-ist/s-core/images/entities/image-entity";
import type {
	DeleteImageResult,
	IImagesCommandRepository,
} from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import type {
	Id,
	Status,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";

export function createImagesCommandRepository(
	prisma: Pick<DatabaseClient, "image">,
) {
	async function create(data: UnexportedImage): Promise<void> {
		await prisma.image.create({
			data,
		});
	}

	async function deleteById(
		id: Id,
		userId: UserId,
		status: Status,
	): Promise<DeleteImageResult> {
		const data = await prisma.image.delete({
			where: { id, userId, status },
			select: { path: true },
		});

		return { path: data.path };
	}

	const imagesCommandRepository: IImagesCommandRepository = {
		create,
		deleteById,
	};

	return imagesCommandRepository;
}
