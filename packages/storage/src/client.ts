import { Client } from "minio";
import { createCfAccessTransport } from "./cf-access-transport";
import type { CfAccessConfig, StorageClientConfig } from "./types";

export function createMinioClient(
	config?: StorageClientConfig,
	cfAccess?: CfAccessConfig,
): Client {
	const resolved = config ?? {
		endPoint: process.env.MINIO_HOST ?? "",
		port: Number(process.env.MINIO_PORT),
		useSSL: process.env.MINIO_USE_SSL === "true",
		accessKey: process.env.MINIO_ACCESS_KEY ?? "",
		secretKey: process.env.MINIO_SECRET_KEY ?? "",
	};

	const resolvedCfAccess = cfAccess ?? {
		clientId: process.env.CF_ACCESS_CLIENT_ID ?? "",
		clientSecret: process.env.CF_ACCESS_CLIENT_SECRET ?? "",
	};

	const transport = resolved.useSSL
		? createCfAccessTransport(resolvedCfAccess)
		: undefined;

	return new Client({
		endPoint: resolved.endPoint,
		port: resolved.port,
		useSSL: resolved.useSSL,
		accessKey: resolved.accessKey,
		secretKey: resolved.secretKey,
		...(transport && { transport }),
	});
}
