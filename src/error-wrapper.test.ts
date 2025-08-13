import { AuthError } from "next-auth";
import { describe, expect, test, vi } from "vitest";
import { PushoverError, UnexpectedError } from "@/error-classes";
import { Prisma } from "@/generated";
import {
	pushoverMonitoringService,
	serverLogger,
} from "@/infrastructure/server";
import { wrapServerSideErrorForClient } from "./error-wrapper";

describe("wrapServerSideErrorForClient", () => {
	test("should handle PushoverError", async () => {
		const error = new PushoverError();

		const result = await wrapServerSideErrorForClient(error);

		expect(serverLogger.error).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideError",
			status: 500,
		});
		expect(result).toEqual({
			success: false,
			message: error.message,
		});
	});

	test("should handle custom errors (e.g., UnexpectedError)", async () => {
		const error = new UnexpectedError();

		const result = await wrapServerSideErrorForClient(error);

		expect(serverLogger.warn).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideError",
			status: 500,
		});
		expect(pushoverMonitoringService.notifyWarning).toHaveBeenCalledWith(
			error.message,
			{ caller: "wrapServerSideError", status: 500 },
		);
		expect(result).toEqual({
			success: false,
			message: error.message,
		});
	});

	test("should handle AuthError with unknown auth type", async () => {
		const error = new AuthError();

		const result = await wrapServerSideErrorForClient(error);

		expect(serverLogger.warn).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideError",
			status: 401, // Updated to more appropriate auth error status
		});
		expect(pushoverMonitoringService.notifyWarning).toHaveBeenCalledWith(
			error.message,
			{ caller: "wrapServerSideError", status: 401 },
		);
		expect(result).toEqual({
			success: false,
			message: "signInUnknown",
		});
	});

	test("should handle PrismaUnexpectedError", async () => {
		const error = new Prisma.PrismaClientValidationError("unknown error", {
			clientVersion: "111",
		});

		const result = await wrapServerSideErrorForClient(error);

		expect(serverLogger.error).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideError",
			status: 500,
		});
		expect(pushoverMonitoringService.notifyError).toHaveBeenCalledWith(
			error.message,
			{ caller: "wrapServerSideError", status: 500 },
		);
		expect(result).toEqual({
			success: false,
			message: "prismaUnexpected",
		});
	});

	test("should handle PrismaClientKnownRequestError", async () => {
		const error = new Prisma.PrismaClientKnownRequestError("Duplicate entry", {
			code: "111",
			clientVersion: "111",
		});

		const result = await wrapServerSideErrorForClient(error);

		expect(serverLogger.warn).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideError",
			status: 400, // Updated to appropriate status for known client errors
		});
		expect(pushoverMonitoringService.notifyWarning).toHaveBeenCalledWith(
			error.message,
			{ caller: "wrapServerSideError", status: 400 },
		);
		expect(result).toEqual({
			success: false,
			message: "prismaDuplicated",
		});
	});

	test("should handle unknown error types", async () => {
		const error = new Error("An unknown error occurred");

		const result = await wrapServerSideErrorForClient(error);

		expect(serverLogger.error).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideError",
			status: 500,
		});
		expect(pushoverMonitoringService.notifyError).toHaveBeenCalledWith(
			error.message,
			{ caller: "wrapServerSideError", status: 500 },
		);
		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});

	test("should handle non errors", async () => {
		const error = "unknown error";

		const result = await wrapServerSideErrorForClient(error);

		expect(serverLogger.error).toHaveBeenCalledWith(
			"unexpected",
			{
				caller: "wrapServerSideError",
				status: 500,
			},
			"unknown error",
		);
		expect(pushoverMonitoringService.notifyError).toHaveBeenCalledWith(
			"unexpected",
			{ caller: "wrapServerSideError", status: 500 },
		);
		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});
});
