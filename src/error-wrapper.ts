"use server";
import "server-only";
import { AuthError } from "next-auth";
import { Prisma } from "@/generated";
import {
	FileNotAllowedError,
	InvalidFormatError,
	PushoverError,
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

	if (
		error instanceof Prisma.PrismaClientValidationError ||
		error instanceof Prisma.PrismaClientUnknownRequestError ||
		error instanceof Prisma.PrismaClientRustPanicError ||
		error instanceof Prisma.PrismaClientInitializationError
	) {
		loggerError(error.message, {
			caller: "wrapServerSideErrorForClient prisma 1",
			status: 500,
		});
		await sendPushoverMessage(error.message);
		return { success: false, message: "prismaUnexpected" };
	}
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		loggerWarn(error.message, {
			caller: "wrapServerSideErrorForClient prisma 2",
			status: 500,
		});
		await sendPushoverMessage(error.message);
		return { success: false, message: "prismaDuplicated" };
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
