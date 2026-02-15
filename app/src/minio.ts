/**
 * MinIO client singleton for object storage.
 *
 * @remarks
 * Provides S3-compatible object storage access for image uploads.
 * Configuration is loaded from environment variables.
 *
 * @module
 */

import type { RequestOptions } from "node:http";
import * as https from "node:https";
import "server-only";
import * as Minio from "minio";
import { env } from "@/env";

/**
 * Custom transport that injects CF-Access headers for Cloudflare Tunnel authentication.
 * Only used when connecting via SSL (production).
 */
const cfAccessTransport = {
	request(options: string | URL | RequestOptions, ...rest: unknown[]) {
		if (typeof options === "object" && !(options instanceof URL)) {
			const headers = (options.headers ?? {}) as Record<string, string>;
			headers["CF-Access-Client-Id"] = env.CF_ACCESS_CLIENT_ID;
			headers["CF-Access-Client-Secret"] = env.CF_ACCESS_CLIENT_SECRET;
			options.headers = headers;
		}

		// biome-ignore lint/suspicious/noExplicitAny: https.request has complex overloads incompatible with Transport type
		return (https.request as any)(options, ...rest);
	},
} as NonNullable<Minio.ClientOptions["transport"]>;

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
export const minioClient = new Minio.Client({
	endPoint: env.MINIO_HOST,
	port: env.MINIO_PORT,
	useSSL: env.MINIO_USE_SSL,
	accessKey: env.MINIO_ACCESS_KEY,
	secretKey: env.MINIO_SECRET_KEY,
	...(env.MINIO_USE_SSL && { transport: cfAccessTransport }),
});
