import { Readable } from "node:stream";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/env", () => ({
	env: {
		MINIO_BUCKET_NAME: "test-bucket",
	},
}));

vi.mock("@/minio", () => ({
	minioClient: {
		getObject: vi.fn(),
	},
}));

vi.mock("@/prisma", () => ({
	default: {
		images: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
		},
	},
}));

import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { imageQueryRepository } from "./image-query-repository";

describe("ImageQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findById", () => {
		test("should find image by id, userId, and status", async () => {
			const mockImage = {
				id: "image-123",
				userId: "user123",
				contentType: "image/png",
				fileSize: 1024,
				width: 800,
				height: 600,
				tags: ["nature", "landscape"],
				description: "A beautiful landscape",
				status: "EXPORTED",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.images.findUnique).mockResolvedValue(mockImage);

			const result = await imageQueryRepository.findById(
				"image-123",
				"user123",
				"EXPORTED",
			);

			expect(prisma.images.findUnique).toHaveBeenCalledWith({
				where: { id: "image-123", userId: "user123", status: "EXPORTED" },
			});
			expect(result).toEqual(mockImage);
		});

		test("should return null when image not found", async () => {
			vi.mocked(prisma.images.findUnique).mockResolvedValue(null);

			const result = await imageQueryRepository.findById(
				"image-999",
				"user123",
				"EXPORTED",
			);

			expect(prisma.images.findUnique).toHaveBeenCalledWith({
				where: { id: "image-999", userId: "user123", status: "EXPORTED" },
			});
			expect(result).toBeNull();
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.images.findUnique).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(
				imageQueryRepository.findById("image-123", "user123", "EXPORTED"),
			).rejects.toThrow("Database error");

			expect(prisma.images.findUnique).toHaveBeenCalledWith({
				where: { id: "image-123", userId: "user123", status: "EXPORTED" },
			});
		});
	});

	describe("findMany", () => {
		test("should find multiple images successfully", async () => {
			const mockImages = [
				{ id: "image-123" },
				{ id: "image-456" },
				{ id: "image-789" },
			];

			vi.mocked(prisma.images.findMany).mockResolvedValue(mockImages);

			const params = {
				orderBy: { createdAt: "desc" as const },
				take: 10,
				skip: 0,
			};

			const result = await imageQueryRepository.findMany(
				"user123",
				"EXPORTED",
				params,
			);

			expect(prisma.images.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true },
				...params,
			});
			expect(result).toEqual(mockImages);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.images.findMany).mockResolvedValue([]);

			const result = await imageQueryRepository.findMany("user123", "EXPORTED");

			expect(prisma.images.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true },
			});
			expect(result).toEqual([]);
		});

		test("should work with cache strategy", async () => {
			const mockImages = [{ id: "image-123" }];

			vi.mocked(prisma.images.findMany).mockResolvedValue(mockImages);

			const params = {
				cacheStrategy: { ttl: 300, swr: 30, tags: ["images"] },
			};

			const result = await imageQueryRepository.findMany(
				"user123",
				"EXPORTED",
				params,
			);

			expect(prisma.images.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true },
				cacheStrategy: { ttl: 300, swr: 30, tags: ["images"] },
			});
			expect(result).toEqual(mockImages);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.images.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(
				imageQueryRepository.findMany("user123", "EXPORTED"),
			).rejects.toThrow("Database connection error");

			expect(prisma.images.findMany).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
				select: { id: true },
			});
		});
	});

	describe("count", () => {
		test("should return count of images", async () => {
			vi.mocked(prisma.images.count).mockResolvedValue(8);

			const result = await imageQueryRepository.count("user123", "EXPORTED");

			expect(prisma.images.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
			expect(result).toBe(8);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(prisma.images.count).mockResolvedValue(0);

			const result = await imageQueryRepository.count("user123", "UNEXPORTED");

			expect(prisma.images.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "UNEXPORTED" },
			});
			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.images.count).mockRejectedValue(
				new Error("Database count error"),
			);

			await expect(
				imageQueryRepository.count("user123", "EXPORTED"),
			).rejects.toThrow("Database count error");

			expect(prisma.images.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
		});
	});

	describe("getFromStorage", () => {
		test("should get object from storage successfully", async () => {
			const mockStream = new Readable();
			const path = "images/user123/image-123.png";

			vi.mocked(minioClient.getObject).mockResolvedValue(mockStream);

			const result = await imageQueryRepository.getFromStorage(path);

			expect(minioClient.getObject).toHaveBeenCalledWith("test-bucket", path);
			expect(result).toBe(mockStream);
		});

		test("should handle storage errors", async () => {
			const path = "images/user123/nonexistent.png";

			vi.mocked(minioClient.getObject).mockRejectedValue(
				new Error("Object not found"),
			);

			await expect(imageQueryRepository.getFromStorage(path)).rejects.toThrow(
				"Object not found",
			);

			expect(minioClient.getObject).toHaveBeenCalledWith("test-bucket", path);
		});
	});
});
