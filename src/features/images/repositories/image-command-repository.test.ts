import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/env", () => ({
	env: {
		MINIO_BUCKET_NAME: "test-bucket",
	},
}));

vi.mock("@/minio", () => ({
	minioClient: {
		putObject: vi.fn(),
	},
}));

vi.mock("@/prisma", () => ({
	default: {
		images: {
			create: vi.fn(),
			delete: vi.fn(),
		},
		$transaction: vi.fn(),
		$accelerate: {
			invalidate: vi.fn(),
		},
	},
}));

import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { imageCommandRepository } from "./image-command-repository";

describe("ImageCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		test("should create image successfully", async () => {
			const mockImage = {
				id: "image-123",
				userId: "user123",
				contentType: "image/png",
				fileSize: 1024,
				width: 800,
				height: 600,
				tags: ["nature", "landscape"],
				description: "A beautiful landscape",
				status: "UNEXPORTED",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const inputData = {
				id: "image-123",
				userId: "user123",
				contentType: "image/png",
				fileSize: 1024,
				width: 800,
				height: 600,
				tags: ["nature", "landscape"],
				description: "A beautiful landscape",
			};

			vi.mocked(prisma.images.create).mockResolvedValue(mockImage);

			const result = await imageCommandRepository.create(inputData);

			expect(prisma.images.create).toHaveBeenCalledWith({
				data: inputData,
			});
			expect(result).toEqual(mockImage);
		});

		test("should create image with minimal data", async () => {
			const mockImage = {
				id: "image-456",
				userId: "user123",
				contentType: "image/jpeg",
				fileSize: null,
				width: null,
				height: null,
				tags: [],
				description: null,
				status: "UNEXPORTED",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const inputData = {
				id: "image-456",
				userId: "user123",
				contentType: "image/jpeg",
			};

			vi.mocked(prisma.images.create).mockResolvedValue(mockImage);

			const result = await imageCommandRepository.create(inputData);

			expect(prisma.images.create).toHaveBeenCalledWith({
				data: inputData,
			});
			expect(result).toEqual(mockImage);
		});

		test("should handle database errors during create", async () => {
			const inputData = {
				id: "image-123",
				userId: "user123",
				contentType: "image/png",
			};

			vi.mocked(prisma.images.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(imageCommandRepository.create(inputData)).rejects.toThrow(
				"Database constraint error",
			);

			expect(prisma.images.create).toHaveBeenCalledWith({
				data: inputData,
			});
		});
	});

	describe("deleteById", () => {
		test("should delete image successfully", async () => {
			vi.mocked(prisma.images.delete).mockResolvedValue({
				id: "image-123",
				userId: "user123",
				contentType: "image/png",
				fileSize: 1024,
				width: 800,
				height: 600,
				tags: [],
				description: null,
				status: "EXPORTED",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await imageCommandRepository.deleteById(
				"image-123",
				"user123",
				"EXPORTED",
			);

			expect(prisma.images.delete).toHaveBeenCalledWith({
				where: { id: "image-123", userId: "user123", status: "EXPORTED" },
			});
		});

		test("should handle not found errors during delete", async () => {
			vi.mocked(prisma.images.delete).mockRejectedValue(
				new Error("Record not found"),
			);

			await expect(
				imageCommandRepository.deleteById("image-999", "user123", "EXPORTED"),
			).rejects.toThrow("Record not found");

			expect(prisma.images.delete).toHaveBeenCalledWith({
				where: { id: "image-999", userId: "user123", status: "EXPORTED" },
			});
		});
	});

	describe("transaction", () => {
		test("should execute transaction successfully", async () => {
			const mockResult = { success: true, data: "test" };
			const mockFn = vi.fn().mockResolvedValue(mockResult);

			vi.mocked(prisma.$transaction).mockResolvedValue(mockResult);

			const result = await imageCommandRepository.transaction(mockFn);

			expect(prisma.$transaction).toHaveBeenCalledWith(mockFn);
			expect(result).toEqual(mockResult);
		});

		test("should handle transaction errors", async () => {
			const mockFn = vi.fn().mockRejectedValue(new Error("Transaction failed"));

			vi.mocked(prisma.$transaction).mockRejectedValue(
				new Error("Transaction failed"),
			);

			await expect(imageCommandRepository.transaction(mockFn)).rejects.toThrow(
				"Transaction failed",
			);

			expect(prisma.$transaction).toHaveBeenCalledWith(mockFn);
		});
	});

	describe("invalidateCache", () => {
		test("should invalidate cache successfully", async () => {
			vi.mocked(prisma.$accelerate.invalidate).mockResolvedValue(undefined);

			await imageCommandRepository.invalidateCache();

			expect(prisma.$accelerate.invalidate).toHaveBeenCalledWith({
				tags: ["images"],
			});
		});

		test("should handle cache invalidation errors", async () => {
			vi.mocked(prisma.$accelerate.invalidate).mockRejectedValue(
				new Error("Cache invalidation failed"),
			);

			await expect(imageCommandRepository.invalidateCache()).rejects.toThrow(
				"Cache invalidation failed",
			);

			expect(prisma.$accelerate.invalidate).toHaveBeenCalledWith({
				tags: ["images"],
			});
		});
	});

	describe("uploadToStorage", () => {
		test("should upload to storage successfully", async () => {
			const buffer = Buffer.from("test image data");
			const path = "images/user123/image-123.png";

			vi.mocked(minioClient.putObject).mockResolvedValue({
				etag: "test-etag",
				versionId: "test-version",
			});

			await imageCommandRepository.uploadToStorage(path, buffer);

			expect(minioClient.putObject).toHaveBeenCalledWith(
				"test-bucket",
				path,
				buffer,
			);
		});

		test("should handle storage upload errors", async () => {
			const buffer = Buffer.from("test image data");
			const path = "images/user123/image-123.png";

			vi.mocked(minioClient.putObject).mockRejectedValue(
				new Error("Storage upload failed"),
			);

			await expect(
				imageCommandRepository.uploadToStorage(path, buffer),
			).rejects.toThrow("Storage upload failed");

			expect(minioClient.putObject).toHaveBeenCalledWith(
				"test-bucket",
				path,
				buffer,
			);
		});
	});
});
