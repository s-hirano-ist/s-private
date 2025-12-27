import { Prisma } from "@s-hirano-ist/s-database";
import { NotificationError } from "@s-hirano-ist/s-notification";
import { APIError } from "better-auth/api";
import { describe, expect, test, vi } from "vitest";
import { UnexpectedError } from "@/common/error/error-classes";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { wrapServerSideErrorForClient } from "./error-wrapper";

// Mock the event dispatcher
vi.mock("@/infrastructures/events/event-dispatcher", () => ({
	eventDispatcher: {
		dispatch: vi.fn(),
	},
}));

// Mock the event setup
vi.mock("@/infrastructures/events/event-setup", () => ({
	initializeEventHandlers: vi.fn(),
}));

describe("wrapServerSideErrorForClient", () => {
	test("should handle NotificationError", async () => {
		const error = new NotificationError();

		const result = await wrapServerSideErrorForClient(error);

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.error",
				payload: expect.objectContaining({
					message: error.message,
					status: 500,
					shouldNotify: true,
				}),
				metadata: expect.objectContaining({
					caller: "wrapServerSideError",
					userId: "system",
				}),
			}),
		);
		expect(result).toEqual({
			success: false,
			message: error.message,
		});
	});

	test("should handle custom errors (e.g., UnexpectedError)", async () => {
		const error = new UnexpectedError();

		const result = await wrapServerSideErrorForClient(error);

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.warning",
				payload: expect.objectContaining({
					message: error.message,
					status: 500,
					shouldNotify: true,
				}),
				metadata: expect.objectContaining({
					caller: "wrapServerSideError",
					userId: "system",
				}),
			}),
		);
		expect(result).toEqual({
			success: false,
			message: error.message,
		});
	});

	test("should handle APIError with unknown auth type", async () => {
		const error = new APIError("UNAUTHORIZED", { message: "Unauthorized" });

		const result = await wrapServerSideErrorForClient(error);

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.warning",
				payload: expect.objectContaining({
					message: error.message,
					status: 401,
					shouldNotify: true,
				}),
				metadata: expect.objectContaining({
					caller: "wrapServerSideError",
					userId: "system",
				}),
			}),
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

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.error",
				payload: expect.objectContaining({
					message: error.message,
					status: 500,
					shouldNotify: true,
				}),
				metadata: expect.objectContaining({
					caller: "wrapServerSideError",
					userId: "system",
				}),
			}),
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

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.error",
				payload: expect.objectContaining({
					message: error.message,
					status: 500,
					shouldNotify: true,
				}),
				metadata: expect.objectContaining({
					caller: "wrapServerSideError",
					userId: "system",
				}),
			}),
		);
		expect(result).toEqual({
			success: false,
			message: "prismaUnexpected",
		});
	});

	test("should handle unknown error types", async () => {
		const error = new Error("An unknown error occurred");

		const result = await wrapServerSideErrorForClient(error);

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.error",
				payload: expect.objectContaining({
					message: error.message,
					status: 500,
					shouldNotify: true,
				}),
				metadata: expect.objectContaining({
					caller: "wrapServerSideError",
					userId: "system",
				}),
			}),
		);
		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});

	test("should handle non errors", async () => {
		const error = "unknown error";

		const result = await wrapServerSideErrorForClient(error);

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.error",
				payload: expect.objectContaining({
					message: "unexpected",
					status: 500,
					extraData: "unknown error",
					shouldNotify: true,
				}),
				metadata: expect.objectContaining({
					caller: "wrapServerSideError",
					userId: "system",
				}),
			}),
		);
		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});
});
