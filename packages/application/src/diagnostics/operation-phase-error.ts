import { StoragePhaseError } from "@s-hirano-ist/s-application/diagnostics/storage-phase-error";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import {
	DuplicateError,
	FileNotAllowedError,
	InvalidFormatError,
	UnexpectedError,
} from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { ZodError } from "zod";

export type OperationPhaseContext = Readonly<{
	action: string;
	additionalContext?: Record<string, unknown>;
	contentType?: string;
	fileName?: string;
	fileSize?: number;
	phase: string;
}>;

export class OperationPhaseError extends Error {
	readonly context: OperationPhaseContext;
	override readonly cause: unknown;

	constructor(context: OperationPhaseContext, cause: unknown) {
		const causeMessage = cause instanceof Error ? cause.message : "unknown";
		super(`${context.action}.${context.phase}: ${causeMessage}`);
		this.name = "OperationPhaseError";
		this.context = context;
		this.cause = cause;
	}
}

function isHandledError(error: unknown): boolean {
	return (
		error instanceof ApplicationError ||
		error instanceof StoragePhaseError ||
		error instanceof UnexpectedError ||
		error instanceof InvalidFormatError ||
		error instanceof FileNotAllowedError ||
		error instanceof DuplicateError ||
		error instanceof ZodError
	);
}
export async function withOperationPhase<T>(
	context: OperationPhaseContext,
	operation: () => Promise<T>,
): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		if (isHandledError(error)) {
			throw error;
		}

		throw new OperationPhaseError(context, error);
	}
}
