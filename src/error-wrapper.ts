"use server";
import "server-only";
import { AuthError } from "next-auth";
import postgres from "postgres";
import {
	FileNotAllowedError,
	InvalidFormatError,
	NotAllowedError,
	PushoverError,
	UnauthorizedError,
	UnexpectedError,
} from "./error-classes";
import { loggerError, loggerWarn } from "./pino";
import type { ServerAction } from "./types";
import { sendPushoverMessage } from "./utils/fetch-message";

export async function wrapServerSideErrorForClient<T>(
	error: unknown,
): Promise<ServerAction<T>> {
	if (error instanceof PushoverError) {
		loggerError(error.message, {
			caller: "wrapServerSideErrorForClient PushoverError",
			status: 500,
		});
		//MEMO: 右記は意味なし await sendPushoverMessage(error.message);
		return { success: false, message: error.message };
	}
	// FIXME: add error handling for MinIO errors
	if (
		error instanceof NotAllowedError ||
		error instanceof UnauthorizedError ||
		error instanceof UnexpectedError ||
		error instanceof InvalidFormatError ||
		error instanceof FileNotAllowedError
	) {
		loggerWarn(error.message, {
			caller: "wrapServerSideErrorForClient custom",
			status: 500,
		});
		await sendPushoverMessage(error.message);
		return { success: false, message: error.message };
	}
	if (error instanceof AuthError) {
		loggerWarn(error.message, {
			caller: "wrapServerSideErrorForClient auth",
			status: 500,
		});
		await sendPushoverMessage(error.message);
		return {
			success: false,
			message: "signInUnknown",
		};
	}

	// Handle Postgres/Drizzle errors  
	if (error instanceof postgres.PostgresError) {
		loggerWarn(`Postgres error: ${error.message}`, {
			caller: "wrapServerSideErrorForClient postgres",
			status: 500,
		});
		await sendPushoverMessage(error.message);
		
		// Handle duplicate key constraint violations
		if (error.code === "23505") {
			return { success: false, message: "duplicatedEntry" };
		}
		// Handle foreign key constraint violations
		if (error.code === "23503") {
			return { success: false, message: "foreignKeyViolation" };
		}
		// Handle check constraint violations
		if (error.code === "23514") {
			return { success: false, message: "checkConstraintViolation" };
		}
		return { success: false, message: "databaseError" };
	}

	if (error instanceof Error) {
		loggerError(error.message, {
			caller: "wrapServerSideErrorForClient unknown error",
			status: 500,
		});
		await sendPushoverMessage(error.message);
	} else {
		loggerError(
			"unexpected",
			{
				caller: "wrapServerSideErrorForClient not error errors",
				status: 500,
			},
			error,
		);
		await sendPushoverMessage("unexpected");
	}
	return { success: false, message: "unexpected" };
}
