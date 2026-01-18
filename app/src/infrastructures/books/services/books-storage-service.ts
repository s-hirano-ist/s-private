/**
 * Books storage service implementation.
 *
 * @remarks
 * Provides object storage operations for book cover images using MinIO.
 * Implements the IStorageService interface from the domain layer.
 *
 * @module
 */

import type { IStorageService } from "@s-hirano-ist/s-core/common/services/storage-service.interface";
import { env } from "@/env";
import { minioClient } from "@/minio";

/**
 * Path prefix for original book images in MinIO bucket.
 * @internal
 */
const ORIGINAL_BOOK_IMAGE_PATH = "books/original";

/**
 * Path prefix for thumbnail book images in MinIO bucket.
 * @internal
 */
const THUMBNAIL_BOOK_IMAGE_PATH = "books/thumbnail";

/**
 * Builds the object key for MinIO operations.
 *
 * @param path - The image path
 * @param isThumbnail - Whether this is a thumbnail
 * @returns The full object key for MinIO
 * @internal
 */
function buildObjectKey(path: string, isThumbnail: boolean): string {
	return `${isThumbnail ? THUMBNAIL_BOOK_IMAGE_PATH : ORIGINAL_BOOK_IMAGE_PATH}/${path}`;
}

async function uploadImage(
	path: string,
	buffer: Buffer,
	isThumbnail: boolean,
): Promise<void> {
	const objKey = buildObjectKey(path, isThumbnail);
	await minioClient.putObject(env.MINIO_BUCKET_NAME, objKey, buffer);
}

async function getImage(
	path: string,
	isThumbnail: boolean,
): Promise<NodeJS.ReadableStream> {
	const objKey = buildObjectKey(path, isThumbnail);
	return await minioClient.getObject(env.MINIO_BUCKET_NAME, objKey);
}

async function getImageOrThrow(
	path: string,
	isThumbnail: boolean,
): Promise<void> {
	const objKey = buildObjectKey(path, isThumbnail);
	await minioClient.statObject(env.MINIO_BUCKET_NAME, objKey);
}

async function deleteImage(path: string, isThumbnail: boolean): Promise<void> {
	const objKey = buildObjectKey(path, isThumbnail);
	await minioClient.removeObject(env.MINIO_BUCKET_NAME, objKey);
}

/**
 * MinIO-based storage service for book cover images.
 *
 * @remarks
 * Handles book cover image storage operations with support for both
 * original and thumbnail versions. Uses different path structure
 * than the general image storage service.
 */
export const booksStorageService: IStorageService = {
	uploadImage,
	getImage,
	getImageOrThrow,
	deleteImage,
};
