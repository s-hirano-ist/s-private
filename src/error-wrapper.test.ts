import { AuthError } from "next-auth";
import { describe, expect, test, vi } from "vitest";
import { NotAllowedError, PushoverError } from "@/error-classes";
import { Prisma } from "@/generated";
import { loggerError, loggerWarn } from "@/pino";
import { sendPushoverMessage } from "@/utils/fetch-message";
import { wrapServerSideErrorForClient } from "./error-wrapper";

vi.mock("@/utils/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
}));

describe("wrapServerSideErrorForClient", () => {
	test("should handle PushoverError", async () => {
		const error = new PushoverError();

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerError).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient PushoverError",
			status: 500,
		});
		expect(sendPushoverMessage).not.toHaveBeenCalled();
		expect(result).toEqual({
			success: false,
			message: error.message,
		});
	});

	test("should handle custom errors (e.g., NotAllowedError)", async () => {
		const error = new NotAllowedError();

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerWarn).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient custom",
			status: 500,
		});
		expect(sendPushoverMessage).toHaveBeenCalledWith(error.message);
		expect(result).toEqual({
			success: false,
			message: error.message,
		});
	});

	test("should handle AuthError with unknown auth type", async () => {
		const error = new AuthError();

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerWarn).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient auth",
			status: 500,
		});
		expect(sendPushoverMessage).toHaveBeenCalledWith(error.message);
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

		expect(loggerError).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient prisma 1",
			status: 500,
		});
		expect(sendPushoverMessage).toHaveBeenCalledWith(error.message);
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

		expect(loggerWarn).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient prisma 2",
			status: 500,
		});
		expect(sendPushoverMessage).toHaveBeenCalledWith(error.message);
		expect(result).toEqual({
			success: false,
			message: "prismaDuplicated",
		});
	});

	test("should handle unknown error types", async () => {
		const error = new Error("An unknown error occurred");

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerError).toHaveBeenCalledWith(error.message, {
			caller: "wrapServerSideErrorForClient unknown error",
			status: 500,
		});
		expect(sendPushoverMessage).toHaveBeenCalledWith(error.message);
		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});

	test("should handle non errors", async () => {
		const error = "unknown error";

		const result = await wrapServerSideErrorForClient(error);

		expect(loggerError).toHaveBeenCalledWith(
			"unexpected",
			{
				caller: "wrapServerSideErrorForClient not error errors",
				status: 500,
			},
			"unknown error",
		);
		expect(sendPushoverMessage).toHaveBeenCalledWith("unexpected");
		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});
});
