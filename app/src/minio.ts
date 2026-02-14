/**
 * MinIO client singleton for object storage.
 *
 * @remarks
 * Provides S3-compatible object storage access for image uploads.
 * Configuration is loaded from environment variables.
 *
 * @module
 */

import "server-only";
import * as Minio from "minio";
import { env } from "@/env";

/**
 * MinIO client instance for object storage operations.
 *
 * @remarks
 * Used by image repository for:
 * - Uploading original images
 * - Uploading thumbnails
 * - Retrieving image binary data
 */
export const minioClient = new Minio.Client({
	endPoint: env.MINIO_HOST,
	port: env.MINIO_PORT,
	useSSL: env.MINIO_USE_SSL,
	accessKey: env.MINIO_ACCESS_KEY,
	secretKey: env.MINIO_SECRET_KEY,
});
