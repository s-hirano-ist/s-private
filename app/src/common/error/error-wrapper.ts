/**
 * Server-side error handling and client response wrapper.
 *
 * @remarks
 * Converts various error types to client-safe ServerAction responses.
 * Dispatches domain events for logging and notification.
 *
 * @module
 */

"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import {
	DuplicateError,
	FileNotAllowedError,
	InvalidFormatError,
	UnexpectedError,
} from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { SystemErrorEvent } from "@s-hirano-ist/s-core/shared-kernel/events/system-error-event";
import { SystemWarningEvent } from "@s-hirano-ist/s-core/shared-kernel/events/system-warning-event";
import { Prisma } from "@s-hirano-ist/s-database";
import { NotificationError } from "@s-hirano-ist/s-notification";
import { S3Error, StorageOperationError } from "@s-hirano-ist/s-storage";
import { APIError } from "better-auth/api";
import { ZodError } from "zod";
import { OperationPhaseError } from "./operation-phase-error";
import { getUploadFileNotAllowedDiagnostics } from "./upload-file-not-allowed-error";

/**
 * Converts FormData to a plain record for error responses.
 *
 * @internal
 */
function formDataToRecord(
	formData?: FormData,
): Record<string, string> | undefined {
	if (!formData) return undefined;
	const record: Record<string, string> = {};
	for (const [key, value] of formData.entries()) {
		if (typeof value === "string") {
			record[key] = value;
		}
	}
	return record;
}

/**
 * Handles NotificationError and S3Error (system errors with notification).
 *
 * @internal
 */
async function handleNotificationOrS3Error(
	error: unknown,
): Promise<ServerAction | undefined> {
	if (error instanceof NotificationError) {
		await eventDispatcher.dispatch(
			new SystemErrorEvent({
				message: error.message,
				status: 500,
				caller: "wrapServerSideError",
				shouldNotify: true,
			}),
		);
		return { success: false, message: error.message };
	}
	if (error instanceof StorageOperationError) {
		await eventDispatcher.dispatch(
			new SystemErrorEvent({
				message: error.message,
				status: 500,
				caller: "wrapServerSideError",
				extraData: {
					storage: error.context,
					cause: error.cause,
				},
				shouldNotify: true,
			}),
		);
		return { success: false, message: "storageError" };
	}
	// MinIO S3 server errors
	if (error instanceof S3Error) {
		await eventDispatcher.dispatch(
			new SystemErrorEvent({
				message: `MinIO S3 Error: ${error.code} - ${error.message}`,
				status: 500,
				caller: "wrapServerSideError",
				extraData: error,
				shouldNotify: true,
			}),
		);
		return { success: false, message: "storageError" };
	}
	return undefined;
}

/**
 * Handles domain warning errors (UnexpectedError, InvalidFormatError,
 * FileNotAllowedError, DuplicateError, APIError).
 *
 * @internal
 */
async function handleDomainWarningError(
	error: unknown,
	formData?: FormData,
): Promise<ServerAction | undefined> {
	if (
		error instanceof UnexpectedError ||
		error instanceof InvalidFormatError ||
		error instanceof FileNotAllowedError
	) {
		const extraData = getUploadFileNotAllowedDiagnostics(error);
		await eventDispatcher.dispatch(
			new SystemWarningEvent({
				message: error.message,
				status: 500,
				caller: "wrapServerSideError",
				extraData,
				shouldNotify: true,
			}),
		);
		return {
			success: false,
			message: error.message,
			formData: formDataToRecord(formData),
		};
	}
	if (error instanceof DuplicateError) {
		await eventDispatcher.dispatch(
			new SystemWarningEvent({
				message: error.message,
				status: 400, // Bad request for duplicate resources
				caller: "wrapServerSideError",
				shouldNotify: true,
			}),
		);
		return {
			success: false,
			message: "duplicated",
			formData: formDataToRecord(formData),
		};
	}
	if (error instanceof APIError) {
		await eventDispatcher.dispatch(
			new SystemWarningEvent({
				message: error.message,
				status: 401, // More appropriate status for auth errors
				caller: "wrapServerSideError",
				shouldNotify: true,
			}),
		);
		return {
			success: false,
			message: "signInUnknown",
		};
	}
	return undefined;
}

/**
 * Handles Prisma database errors and Zod validation errors.
 *
 * @internal
 */
async function handlePrismaOrZodError(
	error: unknown,
	formData?: FormData,
): Promise<ServerAction | undefined> {
	if (
		error instanceof Prisma.PrismaClientValidationError ||
		error instanceof Prisma.PrismaClientUnknownRequestError ||
		error instanceof Prisma.PrismaClientRustPanicError ||
		error instanceof Prisma.PrismaClientInitializationError ||
		error instanceof Prisma.PrismaClientKnownRequestError // 400 errors but should not occur due to domain service validation
	) {
		await eventDispatcher.dispatch(
			new SystemErrorEvent({
				message: (error as Error).message,
				status: 500,
				caller: "wrapServerSideError",
				shouldNotify: true,
			}),
		);
		return { success: false, message: "prismaUnexpected" };
	}

	if (error instanceof ZodError) {
		const message = error.issues[0]?.message ?? "invalidFormat";
		await eventDispatcher.dispatch(
			new SystemWarningEvent({
				message: `Validation error: ${message}`,
				status: 400,
				caller: "wrapServerSideError",
				shouldNotify: false,
			}),
		);
		return {
			success: false,
			message,
			formData: formDataToRecord(formData),
		};
	}
	return undefined;
}

/**
 * Handles any remaining errors as unexpected system errors.
 *
 * @internal
 */
async function handleUnexpectedError(error: unknown): Promise<ServerAction> {
	if (error instanceof OperationPhaseError) {
		await eventDispatcher.dispatch(
			new SystemErrorEvent({
				message: error.message,
				status: 500,
				caller: "wrapServerSideError",
				extraData: {
					phase: error.context,
					cause: error.cause,
				},
				shouldNotify: true,
			}),
		);
		return { success: false, message: "unexpected" };
	}

	if (error instanceof Error) {
		await eventDispatcher.dispatch(
			new SystemErrorEvent({
				message: error.message,
				status: 500,
				caller: "wrapServerSideError",
				extraData: error,
				shouldNotify: true,
			}),
		);
	} else {
		await eventDispatcher.dispatch(
			new SystemErrorEvent({
				message: "unexpected",
				status: 500,
				caller: "wrapServerSideError",
				extraData: error,
				shouldNotify: true,
			}),
		);
	}
	return { success: false, message: "unexpected" };
}

/**
 * Wraps server-side errors for safe client response.
 *
 * @remarks
 * Handles multiple error types:
 * - NotificationError: External notification service failures
 * - UnexpectedError, InvalidFormatError, FileNotAllowedError: Domain errors
 * - DuplicateError: Business rule violations
 * - APIError: Better Auth authentication failures
 * - Prisma errors: Database errors
 *
 * All errors dispatch domain events for logging and optional notification.
 *
 * @param error - The caught error to process
 * @param formData - Optional form data to preserve for retry
 * @returns Client-safe ServerAction response
 */
export async function wrapServerSideErrorForClient(
	error: unknown,
	formData?: FormData,
): Promise<ServerAction> {
	initializeEventHandlers();

	const notificationOrS3 = await handleNotificationOrS3Error(error);
	if (notificationOrS3) return notificationOrS3;

	const domainWarning = await handleDomainWarningError(error, formData);
	if (domainWarning) return domainWarning;

	const prismaOrZod = await handlePrismaOrZodError(error, formData);
	if (prismaOrZod) return prismaOrZod;

	return handleUnexpectedError(error);
}
