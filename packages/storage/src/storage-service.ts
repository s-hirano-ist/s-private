import type { StoragePathConfig, StorageServiceOperations } from "./types.ts";
import type { Client } from "minio";
import {
	type StorageOperationContext,
	StorageOperationError,
} from "./errors.ts";

export function createStorageService(
	client: Client,
	bucketName: string,
	pathConfig: StoragePathConfig,
): StorageServiceOperations {
	function buildObjectKey(path: string, isThumbnail: boolean): string {
		return `${isThumbnail ? pathConfig.thumbnailPrefix : pathConfig.originalPrefix}/${path}`;
	}

	function wrapStorageError(
		operation: StorageOperationContext["operation"],
		objectKey: string,
		isThumbnail: boolean | undefined,
		error: unknown,
	): never {
		throw new StorageOperationError(
			{ operation, objectKey, bucketName, isThumbnail },
			error,
		);
	}

	return {
		async uploadImage(
			path: string,
			buffer: Buffer,
			isThumbnail: boolean,
		): Promise<void> {
			const objKey = buildObjectKey(path, isThumbnail);
			try {
				await client.putObject(bucketName, objKey, buffer);
			} catch (error) {
				wrapStorageError("uploadImage", objKey, isThumbnail, error);
			}
		},

		async getImage(
			path: string,
			isThumbnail: boolean,
		): Promise<NodeJS.ReadableStream> {
			const objKey = buildObjectKey(path, isThumbnail);
			try {
				return await client.getObject(bucketName, objKey);
			} catch (error) {
				return wrapStorageError("getImage", objKey, isThumbnail, error);
			}
		},

		async getImageOrThrow(path: string, isThumbnail: boolean): Promise<void> {
			const objKey = buildObjectKey(path, isThumbnail);
			try {
				await client.statObject(bucketName, objKey);
			} catch (error) {
				wrapStorageError("getImageOrThrow", objKey, isThumbnail, error);
			}
		},

		async deleteImage(path: string, isThumbnail: boolean): Promise<void> {
			const objKey = buildObjectKey(path, isThumbnail);
			try {
				await client.removeObject(bucketName, objKey);
			} catch (error) {
				wrapStorageError("deleteImage", objKey, isThumbnail, error);
			}
		},
	};
}
