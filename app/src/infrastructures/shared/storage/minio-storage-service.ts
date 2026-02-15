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
import { createStorageService } from "@s-hirano-ist/s-storage";
import { env } from "@/env";
import { minioClient } from "@/minio";

/**
 * MinIO-based implementation of IStorageService.
 *
 * @remarks
 * Handles image storage operations with support for both
 * original and thumbnail versions.
 */
export const minioStorageService: IStorageService = createStorageService(
	minioClient,
	env.MINIO_BUCKET_NAME,
	{
		originalPrefix: "images/original",
		thumbnailPrefix: "images/thumbnail",
	},
);
