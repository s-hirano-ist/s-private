import { ERROR_MESSAGES } from "@/constants";
import { LineNotifyError, NotAllowedError } from "@/error-classes";
import { loggerError, loggerWarn } from "@/pino";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { wrapServerSideErrorForClient } from "./error-wrapper";

vi.mock("server-only", () => {
	return {};
});

vi.mock("@/pino", () => ({
	loggerError: vi.fn(),
	loggerWarn: vi.fn(),
}));

vi.mock("@/utils/fetch-message", () => ({
	sendLineNotifyMessage: vi.fn(),
}));

describe("wrapServerSideErrorForClient", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should handle LineNotifyError", async () => {
		const error = new LineNotifyError();

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerError).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient lineNotify",
			status: 500,
		});
		expect(sendLineNotifyMessage).not.toHaveBeenCalled();
		expect(result).toEqual({
			success: false,
			message: error.message,
		});
	});

	it("should handle custom errors (e.g., NotAllowedError)", async () => {
		const error = new NotAllowedError();

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerWarn).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient custom",
			status: 500,
		});
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(error.message);
		expect(result).toEqual({
			success: false,
			message: error.message,
		});
	});

	it("should handle AuthError with CredentialsSignin type", async () => {
		const error = new AuthError();
		error.type = "CredentialsSignin";

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerWarn).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient auth",
			status: 500,
		});
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(error.message);
		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.SIGN_IN,
		});
	});

	it("should handle AuthError with unknown auth type", async () => {
		const error = new AuthError();

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerWarn).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient auth",
			status: 500,
		});
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(error.message);
		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.SIGN_IN_UNKNOWN,
		});
	});

	it("should handle PrismaUnexpectedError", async () => {
		const error = new Prisma.PrismaClientValidationError("unknown error", {
			clientVersion: "111",
		});

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerError).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient prisma 1",
			status: 500,
		});
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(error.message);
		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.PRISMA_UNEXPECTED,
		});
	});

	it("should handle PrismaClientKnownRequestError", async () => {
		const error = new Prisma.PrismaClientKnownRequestError("Duplicate entry", {
			code: "111",
			clientVersion: "111",
		});

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerWarn).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient prisma 2",
			status: 500,
		});
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(error.message);
		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.PRISMA_DUPLICATE,
		});
	});

	it("should handle unknown error types", async () => {
		const error = new Error("An unknown error occurred");

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerError).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient unknown error",
			status: 500,
		});
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(error.message);
		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.UNEXPECTED,
		});
	});

	it("should handle non errors", async () => {
		const error = "unknown error";

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerError).toHaveBeenCalledWith(
			ERROR_MESSAGES.UNEXPECTED,
			{
				caller: "wrapServerSideErrorForClient not error errors",
				status: 500,
			},
			"unknown error",
		);
		expect(sendLineNotifyMessage).toHaveBeenCalledWith(
			ERROR_MESSAGES.UNEXPECTED,
		);
		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.UNEXPECTED,
		});
	});
});
