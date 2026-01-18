import type { Status } from "../../common/entities/common-entity.js";
import type { UnexportedImage } from "../entities/image-entity.js";

/**
 * Command repository interface for the Image domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles write operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * For batch operations (bulkUpdateStatus), use {@link IBatchCommandRepository}
 * from the common module directly.
 *
 * For object storage operations (upload, delete), use {@link IStorageService}
 * from the common module.
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaImagesCommandRepository implements IImagesCommandRepository {
 *   async create(data: UnexportedImage) {
 *     await prisma.image.create({ data });
 *   }
 * }
 * ```
 *
 * @see {@link IImagesQueryRepository} for read operations
 * @see {@link IBatchCommandRepository} for batch operations
 * @see {@link IStorageService} for object storage operations
 */
export type IImagesCommandRepository = {
	/**
	 * Creates a new image in the repository.
	 *
	 * @param data - The unexported image entity to persist
	 */
	create(data: UnexportedImage): Promise<void>;

	/**
	 * Deletes an image by its ID.
	 *
	 * @param id - The image ID to delete
	 * @param userId - The user ID for tenant isolation
	 * @param status - The expected status of the image
	 * @returns The path of the deleted image for event dispatching
	 */
	deleteById(id: string, userId: string, status: Status): Promise<DeleteImageResult>;
};

/**
 * Result type for deleteById operation.
 *
 * @remarks
 * Returns the path of the deleted image for event dispatching.
 */
export type DeleteImageResult = {
	path: string;
};
