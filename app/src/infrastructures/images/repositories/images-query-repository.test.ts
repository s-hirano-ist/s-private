import {
	makePath,
	makePixel,
} from "@s-hirano-ist/s-core/images/entities/image-entity";
import {
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/prisma";
import { imagesQueryRepository } from "./images-query-repository";

describe("ImagesQueryRepository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("findMany", () => {
		test("should find multiple images successfully", async () => {
			const mockImages = [
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b",
					path: "image-123.jpg",
					width: 800,
					height: 600,
				},
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c",
					path: "image-456.jpg",
					width: 1920,
					height: 1080,
				},
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d",
					path: "image-789.jpg",
					width: null,
					height: null,
				},
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
			expect(result).toEqual([
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b"),
					path: makePath("image-123.jpg", false),
					width: makePixel(800),
					height: makePixel(600),
				},
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c"),
					path: makePath("image-456.jpg", false),
					width: makePixel(1920),
					height: makePixel(1080),
				},
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d"),
					path: makePath("image-789.jpg", false),
					width: undefined,
					height: undefined,
				},
			]);
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
			const mockImages = [
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7e",
					path: "image-123.jpg",
					width: 640,
					height: 480,
				},
			];

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
			expect(result).toEqual([
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7e"),
					path: makePath("image-123.jpg", false),
					width: makePixel(640),
					height: makePixel(480),
				},
			]);
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
});
