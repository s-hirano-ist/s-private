import type { ZodError } from "zod";
import { UploadFileNotAllowedError } from "@/common/error/upload-file-not-allowed-error";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { UnexpectedError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { Prisma } from "@s-hirano-ist/s-database";
import { NotificationError } from "@s-hirano-ist/s-notification";
import { S3Error } from "@s-hirano-ist/s-storage";
import { APIError } from "better-auth/api";
import { describe, expect, test, vi } from "vitest";
import { wrapServerSideErrorForClient } from "./error-wrapper";
import { OperationPhaseError } from "./operation-phase-error";

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

// Mock S3Error from storage package
vi.mock("@s-hirano-ist/s-storage", () => ({
	S3Error: class MockS3Error extends Error {
		code?: string;
		constructor(message: string) {
			super(message);
			this.name = "S3Error";
		}
	},
	StorageOperationError: class MockStorageOperationError extends Error {
		context: Record<string, unknown>;
		constructor(context: Record<string, unknown>, cause: unknown) {
			super(
				`Storage ${String(context.operation)} failed for ${String(context.objectKey)}`,
				{
					cause,
				},
			);
			this.name = "StorageOperationError";
			this.context = context;
		}
	},
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

	test("should log upload file rejection diagnostics without changing client message", async () => {
		const error = new UploadFileNotAllowedError({
			reason: "metadata-read-failed",
			fileName: "IMG_9521.jpg",
			fileSize: 2_000_000,
			declaredContentType: "",
			detectedContentType: "image/jpeg",
			causeMessage: "Input buffer has corrupt header",
		});

		const result = await wrapServerSideErrorForClient(error);

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.warning",
				payload: expect.objectContaining({
					message: "invalidFileFormat",
					status: 500,
					extraData: {
						reason: "metadata-read-failed",
						fileName: "IMG_9521.jpg",
						fileSize: 2_000_000,
						declaredContentType: "",
						detectedContentType: "image/jpeg",
						causeMessage: "Input buffer has corrupt header",
					},
					shouldNotify: true,
				}),
			}),
		);
		expect(result).toEqual({
			success: false,
			message: "invalidFileFormat",
		});
	});

	test("should handle APIError with unknown auth type", async () => {
		const error = new APIError("UNAUTHORIZED");

		const result = await wrapServerSideErrorForClient(error);

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.warning",
				payload: expect.objectContaining({
					message: error.message,
					status: 401, // Updated to more appropriate auth error status
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

	test("should log operation phase context for unexpected phase errors", async () => {
		const cause = new Error("repository write failed");
		const error = new OperationPhaseError(
			{
				action: "addImage",
				phase: "create-record",
				fileName: "photo.jpeg",
				fileSize: 1_700_000,
				contentType: "image/jpeg",
			},
			cause,
		);

		const result = await wrapServerSideErrorForClient(error);

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.error",
				payload: expect.objectContaining({
					message: "addImage.create-record: repository write failed",
					status: 500,
					extraData: {
						phase: {
							action: "addImage",
							phase: "create-record",
							fileName: "photo.jpeg",
							fileSize: 1_700_000,
							contentType: "image/jpeg",
						},
						cause,
					},
					shouldNotify: true,
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

	test("should handle ZodError with required message", async () => {
		const { z } = await import("zod");
		const schema = z.string().min(1, { message: "required" });
		let error: ZodError;
		try {
			schema.parse("");
			throw new Error("should not reach");
		} catch (e) {
			error = e as ZodError;
		}
		const formData = new FormData();
		formData.append("category", "");
		formData.append("title", "test");

		const result = await wrapServerSideErrorForClient(error, formData);

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.warning",
				payload: expect.objectContaining({
					message: "Validation error: required",
					status: 400,
					shouldNotify: false,
				}),
			}),
		);
		expect(result).toEqual({
			success: false,
			message: "required",
			formData: { category: "", title: "test" },
		});
	});

	test("should handle ZodError with tooLong message", async () => {
		const { z } = await import("zod");
		const schema = z.string().max(3, { message: "tooLong" });
		let error: ZodError;
		try {
			schema.parse("toolong");
			throw new Error("should not reach");
		} catch (e) {
			error = e as ZodError;
		}

		const result = await wrapServerSideErrorForClient(error);

		expect(result).toEqual({
			success: false,
			message: "tooLong",
			formData: undefined,
		});
	});

	test("should handle MinIO S3Error", async () => {
		const error = new S3Error("Access Denied");
		error.code = "AccessDenied";

		const result = await wrapServerSideErrorForClient(error);

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.error",
				payload: expect.objectContaining({
					message: "MinIO S3 Error: AccessDenied - Access Denied",
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
			message: "storageError",
		});
	});

	test("should handle StorageOperationError", async () => {
		const { StorageOperationError } = await import("@s-hirano-ist/s-storage");
		const cause = new Error("Cloudflare Access denied");
		const error = new StorageOperationError(
			{
				operation: "uploadImage",
				objectKey: "images/original/image.jpg",
				bucketName: "bucket",
				isThumbnail: false,
				phase: "upload-original",
				additionalContext: { action: "addImage", fileSize: 1_700_000 },
			},
			cause,
		);

		const result = await wrapServerSideErrorForClient(error);

		expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: "system.error",
				payload: expect.objectContaining({
					message: "Storage uploadImage failed for images/original/image.jpg",
					status: 500,
					extraData: expect.objectContaining({
						storage: expect.objectContaining({
							phase: "upload-original",
							objectKey: "images/original/image.jpg",
						}),
						cause,
					}),
					shouldNotify: true,
				}),
			}),
		);
		expect(result).toEqual({
			success: false,
			message: "storageError",
		});
	});
});
