import { StorageOperationError } from "@s-hirano-ist/s-storage";

type StoragePhaseContext = {
	additionalContext?: Record<string, unknown>;
	isThumbnail: boolean;
	path: string;
	phase: string;
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
