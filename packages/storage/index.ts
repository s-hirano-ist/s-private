export {
	createObjectStorageClient,
	loadStorageConfig,
	isObjectNotFound,
} from "./src/client.js";
export type { ObjectStorageClient, StorageClientConfig } from "./src/client.js";
export { S3ServiceException } from "@aws-sdk/client-s3";
export { createStorageService } from "./src/storage-service.js";
export { StorageOperationError } from "./src/errors.js";
export type { StorageOperationContext } from "./src/errors.js";
export type {
	StoragePathConfig,
	StorageServiceOperations,
} from "./src/types.js";
