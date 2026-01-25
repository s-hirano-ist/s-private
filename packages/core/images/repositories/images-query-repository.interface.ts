import type {
	Status,
	UserId,
} from "../../shared-kernel/entities/common-entity.js";
import type { IStorageService } from "../../shared-kernel/services/storage-service.interface.js";
import type { InfraQueryOptions } from "../../shared-kernel/types/query-options.js";
import type {
	ExportedImage,
	ImageListItemDTO,
	Path,
	UnexportedImage,
} from "../entities/image-entity.js";
import type { ImagesOrderBy } from "../types/query-params.js";
import type { IImagesCommandRepository } from "./images-command-repository.interface.js";

/**
 * Parameters for paginated image queries.
 *
 * @example
 * ```typescript
 * const params: ImagesFindManyParams = {
 *   orderBy: { createdAt: "desc" },
 *   take: 20,
 *   skip: 0,
 *   cacheStrategy: { ttl: 60, tags: ["images"] },
 * };
 * ```
 *
 * @see {@link ImagesOrderBy} for sorting options
 */
export type ImagesFindManyParams = {
	/** Sort configuration */
	orderBy?: ImagesOrderBy;
} & InfraQueryOptions;

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
 * Return types are either full entities (for single item lookup) or DTOs
 * (for list operations) with properly branded types.
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaImagesQueryRepository implements IImagesQueryRepository {
 *   async findByPath(path: Path, userId: UserId) {
 *     const data = await prisma.image.findUnique({
 *       where: { path, userId }
 *     });
 *     return data ? toImageEntity(data) : null;
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
	 * @returns The image entity if found, null otherwise
	 *
	 * @remarks
	 * Returns a full entity type (UnexportedImage or ExportedImage)
	 * for domain operations like duplicate checking.
	 */
	findByPath(
		path: Path,
		userId: UserId,
	): Promise<UnexportedImage | ExportedImage | null>;

	/**
	 * Retrieves multiple images with pagination and filtering.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by UNEXPORTED or EXPORTED status
	 * @param params - Optional pagination, sorting, and caching parameters
	 * @returns Array of ImageListItemDTO objects
	 *
	 * @see {@link ImagesFindManyParams} for parameter options
	 */
	findMany(
		userId: UserId,
		status: Status,
		params?: ImagesFindManyParams,
	): Promise<ImageListItemDTO[]>;

	/**
	 * Counts images matching the given criteria.
	 *
	 * @param userId - The user ID for tenant isolation
	 * @param status - Filter by status
	 * @returns The count of matching images
	 */
	count(userId: UserId, status: Status): Promise<number>;
};
