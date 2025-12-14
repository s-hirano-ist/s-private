import type { UserId } from "../../common/entities/common-entity";
import { DuplicateError } from "../../errors/error-classes";
import type { Path } from "../entities/image-entity";
import type { IImagesQueryRepository } from "../repositories/images-query-repository.interface";

async function ensureNoDuplicateImage(
	imagesQueryRepository: IImagesQueryRepository,
	path: Path,
	userId: UserId,
): Promise<void> {
	const exists = await imagesQueryRepository.findByPath(path, userId);
	if (exists !== null) throw new DuplicateError();
}

export class ImagesDomainService {
	constructor(private readonly imagesQueryRepository: IImagesQueryRepository) {}

	public async ensureNoDuplicate(path: Path, userId: UserId) {
		return ensureNoDuplicateImage(this.imagesQueryRepository, path, userId);
	}
}
