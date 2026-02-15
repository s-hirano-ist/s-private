import { Client } from "minio";
import { createCfAccessTransport } from "./cf-access-transport";
import type { CfAccessConfig, StorageClientConfig } from "./types";

export function createMinioClient(
	config: StorageClientConfig,
	cfAccess?: CfAccessConfig,
): Client {
	const transport = config.useSSL
		? createCfAccessTransport(cfAccess)
		: undefined;

	return new Client({
		endPoint: config.endPoint,
		port: config.port,
		useSSL: config.useSSL,
		accessKey: config.accessKey,
		secretKey: config.secretKey,
		...(transport && { transport }),
	});
}
