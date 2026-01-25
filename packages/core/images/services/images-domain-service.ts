import type { UserId } from "../../shared-kernel/entities/common-entity.js";
import { DuplicateError } from "../../shared-kernel/errors/error-classes.js";
import type { Path } from "../entities/image-entity.js";
import type { IImagesQueryRepository } from "../repositories/images-query-repository.interface.js";

/**
 * Checks if an image with the given path already exists.
 *
 * @param imagesQueryRepository - The query repository to check against
 * @param path - The path to check for duplicates
 * @param userId - The user ID for tenant isolation
 * @throws {DuplicateError} When an image with this path already exists
 *
 * @internal
 */
async function ensureNoDuplicateImage(
	imagesQueryRepository: IImagesQueryRepository,
	path: Path,
	userId: UserId,
): Promise<void> {
	const exists = await imagesQueryRepository.findByPath(path, userId);
	if (exists !== null) throw new DuplicateError();
}

/**
 * Domain service for Image business logic.
 *
 * @remarks
 * Encapsulates complex business rules that don't belong to a single entity.
 * Uses dependency injection for repository access.
 *
 * @example
 * ```typescript
 * const queryRepo: IImagesQueryRepository = new PrismaImagesQueryRepository();
 * const domainService = new ImagesDomainService(queryRepo);
 *
 * try {
 *   await domainService.ensureNoDuplicate(path, userId);
 *   // Safe to create the image
 * } catch (error) {
 *   if (error instanceof DuplicateError) {
 *     // Handle duplicate path
 *   }
 * }
 * ```
 *
 * @see {@link IImagesQueryRepository} for repository interface
 * @see {@link DuplicateError} for duplicate handling
 */
export class ImagesDomainService {
	/**
	 * Creates a new ImagesDomainService instance.
	 *
	 * @param imagesQueryRepository - The query repository for checking duplicates
	 */
	constructor(private readonly imagesQueryRepository: IImagesQueryRepository) {}

	/**
	 * Validates that no image with the same path exists for the user.
	 *
	 * @param path - The path to check for duplicates
	 * @param userId - The user ID for tenant isolation
	 * @throws {DuplicateError} When an image with this path already exists
	 *
	 * @remarks
	 * This is a domain invariant check that should be called before creating images.
	 */
	public async ensureNoDuplicate(path: Path, userId: UserId) {
		return ensureNoDuplicateImage(this.imagesQueryRepository, path, userId);
	}
}
