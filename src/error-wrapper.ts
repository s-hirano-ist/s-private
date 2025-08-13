"use server";
import "server-only";
import { AuthError } from "next-auth";
import { Prisma } from "@/generated";
import {
	pushoverMonitoringService,
	serverLogger,
} from "@/infrastructure/server";
import {
	FileNotAllowedError,
	InvalidFormatError,
	PushoverError,
	UnexpectedError,
} from "./error-classes";
import type { ServerAction } from "./types";

export async function wrapServerSideErrorForClient<T>(
	error: unknown,
): Promise<ServerAction<T>> {
	if (error instanceof PushoverError) {
		serverLogger.error(error.message, {
			caller: "wrapServerSideError",
			status: 500,
		});
		//MEMO: 右記は意味なし await pushoverMonitoringService.notifyError(error.message, { caller: "wrapServerSideError", status: 500 });
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
		serverLogger.warn(error.message, context);
		await pushoverMonitoringService.notifyWarning(error.message, context);
		return { success: false, message: error.message };
	}
	if (error instanceof AuthError) {
		const context = {
			caller: "wrapServerSideError",
			status: 401 as const, // More appropriate status for auth errors
		};
		serverLogger.warn(error.message, context);
		await pushoverMonitoringService.notifyWarning(error.message, context);
		return {
			success: false,
			message: "signInUnknown",
		};
	}

	if (
		error instanceof Prisma.PrismaClientValidationError ||
		error instanceof Prisma.PrismaClientUnknownRequestError ||
		error instanceof Prisma.PrismaClientRustPanicError ||
		error instanceof Prisma.PrismaClientInitializationError
	) {
		const context = {
			caller: "wrapServerSideError",
			status: 500 as const,
		};
		serverLogger.error(error.message, context);
		await pushoverMonitoringService.notifyError(error.message, context);
		return { success: false, message: "prismaUnexpected" };
	}
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		const context = {
			caller: "wrapServerSideError",
			status: 400 as const, // Known client errors are typically 4xx
		};
		serverLogger.warn(error.message, context);
		await pushoverMonitoringService.notifyWarning(error.message, context);
		return { success: false, message: "prismaDuplicated" };
	}

	if (error instanceof Error) {
		const context = {
			caller: "wrapServerSideError",
			status: 500 as const,
		};
		serverLogger.error(error.message, context);
		await pushoverMonitoringService.notifyError(error.message, context);
	} else {
		const context = {
			caller: "wrapServerSideError",
			status: 500 as const,
		};
		serverLogger.error("unexpected", context, error);
		await pushoverMonitoringService.notifyError("unexpected", context);
	}
	return { success: false, message: "unexpected" };
}
