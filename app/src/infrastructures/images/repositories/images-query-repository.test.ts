import { Readable } from "node:stream";
import { makeUserId } from "s-private-domains/common/entities/common-entity";
import { Path } from "s-private-domains/images/entities/image-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { imagesQueryRepository } from "./images-query-repository";

// Simple path parser for testing
const makeTestPath = (v: string): Path => Path.parse(v);

describe("ImagesQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findMany", () => {
		test("should find multiple images successfully", async () => {
			const mockImages = [
				{ paths: "image-123" },
				{ paths: "image-456" },
				{ paths: "image-789" },
			];

			vi.mocked(prisma.image.findMany).mockResolvedValue(mockImages);

			const params = {
				orderBy: { createdAt: "desc" as const },
				take: 10,
				skip: 0,
			};

			const result = await imagesQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
				params,
			);

			expect(prisma.image.findMany).toHaveBeenCalled();
			expect(result).toEqual(mockImages);
		});

		test("should handle empty results", async () => {
			vi.mocked(prisma.image.findMany).mockResolvedValue([]);

			const result = await imagesQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
			);

			expect(prisma.image.findMany).toHaveBeenCalled();
			expect(result).toEqual([]);
		});

		test("should work with cache strategy", async () => {
			const mockImages = [{ paths: "image-123" }];

			vi.mocked(prisma.image.findMany).mockResolvedValue(mockImages);

			const params = {
				cacheStrategy: { ttl: 300, swr: 30, tags: ["images"] },
			};

			const result = await imagesQueryRepository.findMany(
				makeUserId("user123"),
				"EXPORTED",
				params,
			);

			expect(prisma.image.findMany).toHaveBeenCalled();
			expect(result).toEqual(mockImages);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.image.findMany).mockRejectedValue(
				new Error("Database connection error"),
			);

			await expect(
				imagesQueryRepository.findMany(makeUserId("user123"), "EXPORTED"),
			).rejects.toThrow("Database connection error");

			expect(prisma.image.findMany).toHaveBeenCalled();
		});
	});

	describe("count", () => {
		test("should return count of images", async () => {
			vi.mocked(prisma.image.count).mockResolvedValue(8);

			const result = await imagesQueryRepository.count(
				makeUserId("user123"),
				"EXPORTED",
			);

			expect(prisma.image.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
			expect(result).toBe(8);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(prisma.image.count).mockResolvedValue(0);

			const result = await imagesQueryRepository.count(
				makeUserId("user123"),
				"UNEXPORTED",
			);

			expect(prisma.image.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "UNEXPORTED" },
			});
			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(prisma.image.count).mockRejectedValue(
				new Error("Database count error"),
			);

			await expect(
				imagesQueryRepository.count(makeUserId("user123"), "EXPORTED"),
			).rejects.toThrow("Database count error");

			expect(prisma.image.count).toHaveBeenCalledWith({
				where: { userId: "user123", status: "EXPORTED" },
			});
		});
	});

	describe("getFromStorage", () => {
		test("should get object from storage successfully", async () => {
			const mockStream = new Readable();
			const path = "images/user123/image-123.png";

			vi.mocked(minioClient.getObject).mockResolvedValue(mockStream);

			const result = await imagesQueryRepository.getFromStorage(
				makeTestPath(path),
				false,
			);

			expect(minioClient.getObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
			);
			expect(result).toBe(mockStream);
		});

		test("should handle storage errors", async () => {
			const path = "images/user123/nonexistent.png";

			vi.mocked(minioClient.getObject).mockRejectedValue(
				new Error("Object not found"),
			);

			await expect(
				imagesQueryRepository.getFromStorage(makeTestPath(path), false),
			).rejects.toThrow("Object not found");

			expect(minioClient.getObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
			);
		});
	});
});
