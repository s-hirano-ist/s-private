export {
	createObjectStorageClient,
	loadStorageConfig,
	isObjectNotFound,
} from "./client.js";
export type { ObjectStorageClient, StorageClientConfig } from "./client.js";
export { S3ServiceException } from "@aws-sdk/client-s3";
export { createStorageService } from "./storage-service.js";
export { StorageOperationError } from "./errors.js";
export type { StorageOperationContext } from "./errors.js";
export type { StoragePathConfig, StorageServiceOperations } from "./types.js";
