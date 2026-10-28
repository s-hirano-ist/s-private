/**
 * Books storage service implementation.
 *
 * @remarks
 * Provides object storage operations for book cover images using MinIO.
 * Implements the IStorageService interface from the domain layer.
 *
 * @module
 */

import type { IStorageService } from "@s-hirano-ist/s-application/content/storage-port";
import { createStorageService } from "@s-hirano-ist/s-storage";

/**
 * Path prefix for original book images in MinIO bucket.
 */
export const ORIGINAL_BOOK_IMAGE_PATH = "books/original";

/**
 * Path prefix for thumbnail book images in MinIO bucket.
 */
export const THUMBNAIL_BOOK_IMAGE_PATH = "books/thumbnail";

/**
 * MinIO-based storage service for book cover images.
 *
 * @remarks
 * Handles book cover image storage operations with support for both
 * original and thumbnail versions. Uses different path structure
 * than the general image storage service.
 */
export function createBooksStorageService(
	minioClient: Parameters<typeof createStorageService>[0],
	bucketName: string,
): IStorageService {
	return createStorageService(minioClient, bucketName, {
		originalPrefix: ORIGINAL_BOOK_IMAGE_PATH,
		thumbnailPrefix: THUMBNAIL_BOOK_IMAGE_PATH,
	});
}
