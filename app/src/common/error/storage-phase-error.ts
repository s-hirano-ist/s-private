import { StorageOperationError } from "@s-hirano-ist/s-storage";

type StoragePhaseContext = {
	phase: string;
	path: string;
	isThumbnail: boolean;
	additionalContext?: Record<string, unknown>;
};

export async function withStoragePhase<T>(
	context: StoragePhaseContext,
	operation: () => Promise<T>,
): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		if (error instanceof StorageOperationError) {
			throw new StorageOperationError(
				{
					...error.context,
					phase: context.phase,
					additionalContext: context.additionalContext,
				},
				error.cause ?? error,
			);
		}

		throw new StorageOperationError(
			{
				operation: "uploadImage",
				objectKey: context.path,
				bucketName: "unknown",
				isThumbnail: context.isThumbnail,
				phase: context.phase,
				additionalContext: context.additionalContext,
			},
			error,
		);
	}
}
