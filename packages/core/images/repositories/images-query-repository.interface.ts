import type { Status, UserId } from "../../common/entities/common-entity.js";
import type { Path } from "../entities/image-entity.js";
import type { ImagesFindManyParams } from "../types/query-params.js";

/**
 * Query repository interface for the Image domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles read operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma).
 *
 * For object storage operations (get image), use {@link IStorageService}
 * from the common module.
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaImagesQueryRepository implements IImagesQueryRepository {
 *   async findByPath(path: Path, userId: UserId) {
 *     return await prisma.image.findUnique({
 *       where: { path, userId }
 *     });
 *   }
 * }
 * ```
 *
 * @see {@link IImagesCommandRepository} for write operations
 * @see {@link IStorageService} for object storage operations
 */
export type IImagesQueryRepository = {
	/**
	 * Finds an image by its path for a specific user.
	 *
	 * @param path - The validated path to search for
	 * @param userId - The user ID for tenant isolation
	 * @returns The image data if found, null otherwise
	 */
	findByPath(
		path: Path,
		userId: UserId,
	): Promise<{
		id: string;
		path: string;
		contentType: string;
		fileSize: number | null;
		width: number | null;
		height: number | null;
		tags: string[];
		status: string;
		description: string | null;
	} | null>;

	/**
	 * Retrieves multiple images with pagination and filtering.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by UNEXPORTED or EXPORTED status
	 * @param params - Optional pagination, sorting, and caching parameters
	 * @returns Array of image data objects
	 *
	 * @see {@link ImagesFindManyParams} for parameter options
	 */
	findMany(
		userId: UserId,
		status: Status,
		params?: ImagesFindManyParams,
	): Promise<
		{ id: string; path: string; height: number | null; width: number | null }[]
	>;

	/**
	 * Counts images matching the given criteria.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by status
	 * @returns The count of matching images
	 */
	count(userId: UserId, status: Status): Promise<number>;
};
