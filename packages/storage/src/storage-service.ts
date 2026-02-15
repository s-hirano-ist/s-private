import type { Client } from "minio";
import type { StoragePathConfig, StorageServiceOperations } from "./types";

export function createStorageService(
	client: Client,
	bucketName: string,
	pathConfig: StoragePathConfig,
): StorageServiceOperations {
	function buildObjectKey(path: string, isThumbnail: boolean): string {
		return `${isThumbnail ? pathConfig.thumbnailPrefix : pathConfig.originalPrefix}/${path}`;
	}

	return {
		async uploadImage(
			path: string,
			buffer: Buffer,
			isThumbnail: boolean,
		): Promise<void> {
			const objKey = buildObjectKey(path, isThumbnail);
			await client.putObject(bucketName, objKey, buffer);
		},

		async getImage(
			path: string,
			isThumbnail: boolean,
		): Promise<NodeJS.ReadableStream> {
			const objKey = buildObjectKey(path, isThumbnail);
			return await client.getObject(bucketName, objKey);
		},

		async getImageOrThrow(path: string, isThumbnail: boolean): Promise<void> {
			const objKey = buildObjectKey(path, isThumbnail);
			await client.statObject(bucketName, objKey);
		},

		async deleteImage(path: string, isThumbnail: boolean): Promise<void> {
			const objKey = buildObjectKey(path, isThumbnail);
			await client.removeObject(bucketName, objKey);
		},
	};
}
