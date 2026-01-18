/**
 * Storage service interface for object storage operations.
 *
 * @remarks
 * Abstracts file storage operations from domain repositories.
 * Implementations should be provided by the infrastructure layer (e.g., MinIO, S3).
 *
 * This interface follows the dependency inversion principle - the domain layer
 * defines the interface, while the infrastructure layer provides the implementation.
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class MinioStorageService implements IStorageService {
 *   async uploadImage(path: string, buffer: Buffer, isThumbnail: boolean) {
 *     const bucketPath = isThumbnail ? `thumbnails/${path}` : `originals/${path}`;
 *     await minio.putObject(bucket, bucketPath, buffer);
 *   }
 * }
 * ```
 */
export type IStorageService = {
	/**
	 * Uploads an image to object storage.
	 *
	 * @param path - The storage path for the image
	 * @param buffer - The image data buffer
	 * @param isThumbnail - Whether this is a thumbnail upload
	 */
	uploadImage(
		path: string,
		buffer: Buffer,
		isThumbnail: boolean,
	): Promise<void>;

	/**
	 * Retrieves an image from object storage.
	 *
	 * @param path - The storage path of the image
	 * @param isThumbnail - Whether to retrieve the thumbnail version
	 * @returns A readable stream of the image data
	 */
	getImage(path: string, isThumbnail: boolean): Promise<NodeJS.ReadableStream>;

	/**
	 * Verifies an image exists in storage or throws an error.
	 *
	 * @param path - The storage path of the image
	 * @param isThumbnail - Whether to check the thumbnail version
	 * @throws When the image is not found in storage
	 */
	getImageOrThrow(path: string, isThumbnail: boolean): Promise<void>;

	/**
	 * Deletes an image from object storage.
	 *
	 * @param path - The storage path of the image
	 * @param isThumbnail - Whether this is a thumbnail deletion
	 */
	deleteImage(path: string, isThumbnail: boolean): Promise<void>;
};
