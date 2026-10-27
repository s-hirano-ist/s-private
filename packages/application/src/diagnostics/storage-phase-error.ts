type StoragePhaseContext = {
	additionalContext?: Record<string, unknown>;
	isThumbnail: boolean;
	path: string;
	phase: string;
};
export class StoragePhaseError extends Error {
	constructor(
		readonly context: StoragePhaseContext,
		cause: unknown,
	) {
		super(`Storage ${context.phase} failed`, { cause });
		this.name = "StoragePhaseError";
	}
}
export async function withStoragePhase<T>(
	context: StoragePhaseContext,
	operation: () => Promise<T>,
): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		throw new StoragePhaseError(context, error);
	}
}
