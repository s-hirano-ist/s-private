"use server";
import "server-only";
import { AuthError } from "next-auth";
import { ServerAction } from "@/common/types";
import { Prisma } from "@/generated";
import { serverLogger } from "@/o11y/server";
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

export async function wrapServerSideErrorForClient<T>(
	error: unknown,
	formData?: FormData,
): Promise<ServerAction> {
	if (error instanceof PushoverError) {
		serverLogger.error(
			error.message,
			{
				caller: "wrapServerSideError",
				status: 500,
			},
			undefined,
			{ notify: true },
		);
		return { success: false, message: error.message };
	}
	// FIXME: add error handling for MinIO errors
	if (
		error instanceof UnexpectedError ||
		error instanceof InvalidFormatError ||
		error instanceof FileNotAllowedError
	) {
		const context = {
			caller: "wrapServerSideError",
			status: 500 as const,
		};
		serverLogger.warn(error.message, context, { notify: true });
		return {
			success: false,
			message: error.message,
			formData: formDataToRecord(formData),
		};
	}
	if (error instanceof DuplicateError) {
		const context = {
			caller: "wrapServerSideError",
			status: 400 as const, // Bad request for duplicate resources
		};
		serverLogger.warn(error.message, context, { notify: true });
		return {
			success: false,
			message: "duplicated",
			formData: formDataToRecord(formData),
		};
	}
	if (error instanceof AuthError) {
		const context = {
			caller: "wrapServerSideError",
			status: 401 as const, // More appropriate status for auth errors
		};
		serverLogger.warn(error.message, context, { notify: true });
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
		const context = {
			caller: "wrapServerSideError",
			status: 500 as const,
		};
		serverLogger.error(error.message, context, undefined, { notify: true });
		return { success: false, message: "prismaUnexpected" };
	}

	if (error instanceof Error) {
		const context = {
			caller: "wrapServerSideError",
			status: 500 as const,
		};
		serverLogger.error(error.message, context, undefined, { notify: true });
	} else {
		const context = {
			caller: "wrapServerSideError",
			status: 500 as const,
		};
		serverLogger.error("unexpected", context, error, { notify: true });
	}
	return { success: false, message: "unexpected" };
}
