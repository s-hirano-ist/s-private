export type StorageOperationContext = {
	operation: "uploadImage" | "getImage" | "getImageOrThrow" | "deleteImage";
	objectKey: string;
	bucketName: string;
	isThumbnail?: boolean;
	phase?: string;
	additionalContext?: Record<string, unknown>;
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
