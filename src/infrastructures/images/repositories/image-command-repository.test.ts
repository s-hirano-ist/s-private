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
		$accelerate: {
			invalidate: vi.fn(),
		},
	},
}));

import { Status } from "@/generated";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { imagesCommandRepository } from "./images-command-repository";

describe("ImageCommandRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		test("should create image successfully", async () => {
			const mockImage = {
				id: "image-123",
				path: "image-123",
				userId: "user123",
				contentType: "image/png",
				fileSize: 1024,
				width: 800,
				height: 600,
				tags: ["nature", "landscape"],
				description: "A beautiful landscape",
				status: "UNEXPORTED" as Status,
				createdAt: new Date(),
				updatedAt: new Date(),
				exportedAt: new Date(),
			};

			const inputData = {
				id: "image-123",
				paths: "image-123",
				userId: "user123",
				contentType: "image/png",
				fileSize: 1024,
				width: 800,
				height: 600,
				tags: ["nature", "landscape"],
				description: "A beautiful landscape",
			};

			vi.mocked(prisma.images.create).mockResolvedValue(mockImage);

			const result = await imagesCommandRepository.create(inputData);

			expect(prisma.images.create).toHaveBeenCalledWith({
				data: inputData,
			});
			expect(result).toEqual(mockImage);
		});

		test("should create image with minimal data", async () => {
			const mockImage = {
				id: "image-456",
				paths: "image-456",
				userId: "user123",
				contentType: "image/jpeg",
				fileSize: null,
				width: null,
				height: null,
				tags: [],
				description: null,
				status: "UNEXPORTED" as Status,
				createdAt: new Date(),
				updatedAt: new Date(),
				ogImageUrl: "https://example.com/og-image.jpg",
				exportedAt: new Date(),
			};

			const inputData = {
				paths: "image-456",
				userId: "user123",
				contentType: "image/jpeg",
			};

			vi.mocked(prisma.images.create).mockResolvedValue(mockImage);

			const result = await imagesCommandRepository.create(inputData);

			expect(prisma.images.create).toHaveBeenCalledWith({
				data: inputData,
			});
			expect(result).toEqual(mockImage);
		});

		test("should handle database errors during create", async () => {
			const inputData = {
				paths: "image-123",
				userId: "user123",
				contentType: "image/png",
			};

			vi.mocked(prisma.images.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(imagesCommandRepository.create(inputData)).rejects.toThrow(
				"Database constraint error",
			);

			expect(prisma.images.create).toHaveBeenCalledWith({
				data: inputData,
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

			await imagesCommandRepository.uploadToStorage(path, buffer);

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
				imagesCommandRepository.uploadToStorage(path, buffer),
			).rejects.toThrow("Storage upload failed");

			expect(minioClient.putObject).toHaveBeenCalledWith(
				"test-bucket",
				path,
				buffer,
			);
		});
	});
});
