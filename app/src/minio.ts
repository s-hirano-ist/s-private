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
import { createMinioClient } from "@s-hirano-ist/s-storage";

/**
 * MinIO client instance for object storage operations.
 *
 * @remarks
 * Used by image repository for:
 * - Uploading original images
 * - Uploading thumbnails
 * - Retrieving image binary data
 *
 * When SSL is enabled (production), CF-Access headers are injected via custom transport
 * for Cloudflare Tunnel authentication.
 */
export const minioClient = createMinioClient();
