import {
	DuplicateError,
	FileNotAllowedError,
	InvalidFormatError,
	UnexpectedError,
} from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { Prisma } from "@s-hirano-ist/s-database";
import { NotificationError } from "@s-hirano-ist/s-notification";
import { S3Error, StorageOperationError } from "@s-hirano-ist/s-storage";
import { APIError } from "better-auth/api";
import { ZodError } from "zod";

export type OperationPhaseContext = Readonly<{
	action: string;
	phase: string;
	fileName?: string;
	fileSize?: number;
	contentType?: string;
	additionalContext?: Record<string, unknown>;
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
		error instanceof NotificationError ||
		error instanceof StorageOperationError ||
		error instanceof S3Error ||
		error instanceof UnexpectedError ||
		error instanceof InvalidFormatError ||
		error instanceof FileNotAllowedError ||
		error instanceof DuplicateError ||
		error instanceof APIError ||
		error instanceof Prisma.PrismaClientValidationError ||
		error instanceof Prisma.PrismaClientUnknownRequestError ||
		error instanceof Prisma.PrismaClientRustPanicError ||
		error instanceof Prisma.PrismaClientInitializationError ||
		error instanceof Prisma.PrismaClientKnownRequestError ||
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
