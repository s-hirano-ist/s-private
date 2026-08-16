export type StorageOperationContext = {
	additionalContext?: Record<string, unknown>;
	bucketName: string;
	isThumbnail?: boolean;
	objectKey: string;
	operation: "uploadImage" | "getImage" | "getImageOrThrow" | "deleteImage";
	phase?: string;
};

export class StorageOperationError extends Error {
	readonly context: StorageOperationContext;

	constructor(context: StorageOperationContext, cause: unknown) {
		super(`Storage ${context.operation} failed for ${context.objectKey}`, {
			cause,
		});
		this.name = "StorageOperationError";
		this.context = context;
	}
}
