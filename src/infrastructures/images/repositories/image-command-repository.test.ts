import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/env", () => ({
	env: {
		MINIO_BUCKET_NAME: "test-bucket",
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

			vi.mocked(prisma.images.create).mockResolvedValue(mockImage);

			const result = await imagesCommandRepository.create({
				id: "image-123",
				path: "image-123",
				userId: "user123",
				contentType: "image/png",
				fileSize: 1024,
				width: 800,
				height: 600,
				tags: ["nature", "landscape"],
				description: "A beautiful landscape",
				status: "UNEXPORTED",
			});

			expect(prisma.images.create).toHaveBeenCalledWith({
				data: {
					id: "image-123",
					path: "image-123",
					userId: "user123",
					contentType: "image/png",
					fileSize: 1024,
					width: 800,
					height: 600,
					tags: ["nature", "landscape"],
					description: "A beautiful landscape",
					status: "UNEXPORTED",
				},
			});
			expect(result).toBeUndefined();
		});

		test("should create image with minimal data", async () => {
			vi.mocked(prisma.images.create).mockResolvedValue({
				id: "image-456",
				path: "image-456",
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
				exportedAt: new Date(),
			});

			const result = await imagesCommandRepository.create({
				path: "image-456",
				userId: "user123",
				contentType: "image/jpeg",
				status: "UNEXPORTED",
				id: "1",
			});

			expect(prisma.images.create).toHaveBeenCalledWith({
				data: {
					path: "image-456",
					userId: "user123",
					contentType: "image/jpeg",
					status: "UNEXPORTED",
					id: "1",
				},
			});
			expect(result).toBeUndefined();
		});

		test("should handle database errors during create", async () => {
			vi.mocked(prisma.images.create).mockRejectedValue(
				new Error("Database constraint error"),
			);

			await expect(
				imagesCommandRepository.create({
					path: "image-123",
					userId: "user123",
					contentType: "image/png",
					status: "UNEXPORTED",
					id: "1",
				}),
			).rejects.toThrow("Database constraint error");

			expect(prisma.images.create).toHaveBeenCalledWith({
				data: {
					path: "image-123",
					userId: "user123",
					contentType: "image/png",
					status: "UNEXPORTED",
					id: "1",
				},
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

			await imagesCommandRepository.uploadToStorage(path, buffer, false);

			expect(minioClient.putObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
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
				imagesCommandRepository.uploadToStorage(path, buffer, false),
			).rejects.toThrow("Storage upload failed");

			expect(minioClient.putObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
				buffer,
			);
		});
	});
});
