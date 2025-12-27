import type { Status } from "../../common/entities/common-entity.js";
import type { Path, UnexportedImage } from "../entities/image-entity.js";

/**
 * Command repository interface for the Image domain.
 *
 * @remarks
 * Follows the CQRS pattern - this interface handles write operations only.
 * Implementations should be provided by the infrastructure layer (e.g., Prisma + MinIO).
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PrismaImagesCommandRepository implements IImagesCommandRepository {
 *   async create(data: UnexportedImage) {
 *     await prisma.image.create({ data });
 *   }
 *
 *   async uploadToStorage(path: Path, buffer: Buffer, isThumbnail: boolean) {
 *     const bucketPath = isThumbnail ? `thumbnails/${path}` : path;
 *     await minio.putObject(bucket, bucketPath, buffer);
 *   }
 * }
 * ```
 *
 * @see {@link IImagesQueryRepository} for read operations
 */
export type IImagesCommandRepository = {
	/**
	 * Creates a new image in the repository.
	 *
	 * @param data - The unexported image entity to persist
	 */
	create(data: UnexportedImage): Promise<void>;

	/**
	 * Uploads an image buffer to object storage.
	 *
	 * @param path - The storage path for the image
	 * @param buffer - The image data buffer
	 * @param isThumbnail - Whether this is a thumbnail upload
	 */
	uploadToStorage(
		path: Path,
		buffer: Buffer,
		isThumbnail: boolean,
	): Promise<void>;

	/**
	 * Deletes an image by its ID.
	 *
	 * @param id - The image ID to delete
	 * @param userId - The user ID for tenant isolation
	 * @param status - The expected status of the image
	 */
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};
