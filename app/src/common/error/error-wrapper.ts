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
import {
	DuplicateError,
	FileNotAllowedError,
	InvalidFormatError,
	UnexpectedError,
} from "@s-hirano-ist/s-core/errors/error-classes";
import { SystemErrorEvent } from "@s-hirano-ist/s-core/shared-kernel/events/system-error-event";
import { SystemWarningEvent } from "@s-hirano-ist/s-core/shared-kernel/events/system-warning-event";
import { Prisma } from "@s-hirano-ist/s-database";
import { NotificationError } from "@s-hirano-ist/s-notification";
import { AuthError } from "next-auth";
import type { ServerAction } from "@/common/types";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";

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
 * Wraps server-side errors for safe client response.
 *
 * @remarks
 * Handles multiple error types:
 * - NotificationError: External notification service failures
 * - UnexpectedError, InvalidFormatError, FileNotAllowedError: Domain errors
 * - DuplicateError: Business rule violations
 * - AuthError: Authentication failures
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
	// FIXME: add error handling for MinIO errors
	if (
		error instanceof UnexpectedError ||
		error instanceof InvalidFormatError ||
		error instanceof FileNotAllowedError
	) {
		await eventDispatcher.dispatch(
			new SystemWarningEvent({
				message: error.message,
				status: 500,
				caller: "wrapServerSideError",
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
	if (error instanceof AuthError) {
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

	if (error instanceof Error) {
		await eventDispatcher.dispatch(
			new SystemErrorEvent({
				message: error.message,
				status: 500,
				caller: "wrapServerSideError",
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
