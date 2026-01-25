/**
 * MinIO storage service implementation.
 *
 * @remarks
 * Provides object storage operations using MinIO client.
 * Implements the IStorageService interface from the domain layer.
 *
 * @module
 */

import type { IStorageService } from "@s-hirano-ist/s-core/shared-kernel/services/storage-service.interface";
import { env } from "@/env";
import { minioClient } from "@/minio";

/**
 * Path prefix for original images in MinIO bucket.
 * @internal
 */
const ORIGINAL_IMAGE_PATH = "originals";

/**
 * Path prefix for thumbnail images in MinIO bucket.
 * @internal
 */
const THUMBNAIL_IMAGE_PATH = "thumbnails";

/**
 * Builds the object key for MinIO operations.
 *
 * @param path - The image path
 * @param isThumbnail - Whether this is a thumbnail
 * @returns The full object key for MinIO
 * @internal
 */
function buildObjectKey(path: string, isThumbnail: boolean): string {
	return `${isThumbnail ? THUMBNAIL_IMAGE_PATH : ORIGINAL_IMAGE_PATH}/${path}`;
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
 * MinIO-based implementation of IStorageService.
 *
 * @remarks
 * Handles image storage operations with support for both
 * original and thumbnail versions.
 */
export const minioStorageService: IStorageService = {
	uploadImage,
	getImage,
	getImageOrThrow,
	deleteImage,
};
