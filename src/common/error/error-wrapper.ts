"use server";
import "server-only";
import { AuthError } from "next-auth";
import type { ServerAction } from "@/common/types";
import { SystemErrorEvent } from "@/domains/common/events/system-error-event";
import { SystemWarningEvent } from "@/domains/common/events/system-warning-event";
import { Prisma } from "@/generated";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import {
	DuplicateError,
	FileNotAllowedError,
	InvalidFormatError,
	PushoverError,
	UnexpectedError,
} from "./error-classes";

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

export async function wrapServerSideErrorForClient(
	error: unknown,
	formData?: FormData,
): Promise<ServerAction> {
	initializeEventHandlers();

	if (error instanceof PushoverError) {
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
				message: error.message,
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
