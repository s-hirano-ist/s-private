import { makeId } from "@s-hirano-ist/s-core/common/entities/common-entity";
import {
	makePath,
	makePixel,
} from "@s-hirano-ist/s-core/images/entities/image-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { minioStorageService } from "@/infrastructures/common/services/minio-storage-service";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";
import {
	getExportedImages,
	getImagesCount,
	getImagesFromStorage,
	getUnexportedImages,
} from "./get-images";

vi.mock(
	"@/infrastructures/images/repositories/images-query-repository",
	() => ({
		imagesQueryRepository: {
			findMany: vi.fn(),
			count: vi.fn(),
		},
	}),
);

vi.mock("@/infrastructures/common/services/minio-storage-service", () => ({
	minioStorageService: { getImage: vi.fn() },
}));

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn().mockResolvedValue("test-user-id"),
}));

describe("get-images", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getExportedImages", () => {
		test("should fetch exported images with correct parameters", async () => {
			const mockImages = [
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b"),
					path: makePath("image1.jpg", false),
					height: makePixel(100),
					width: makePixel(200),
				},
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c"),
					path: makePath("image2.jpg", false),
					height: makePixel(150),
					width: makePixel(250),
				},
			];

			vi.mocked(imagesQueryRepository.findMany).mockResolvedValue(mockImages);

			const result = await getExportedImages(1);

			expect(imagesQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				{
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["testuserid_images"] },
				},
			);

			expect(result).toEqual([
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b",
					originalPath: "/api/images/original/image1.jpg",
					thumbnailPath: "/api/images/thumbnail/image1.jpg",
					height: 100,
					width: 200,
				},
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7c",
					originalPath: "/api/images/original/image2.jpg",
					thumbnailPath: "/api/images/thumbnail/image2.jpg",
					height: 150,
					width: 250,
				},
			]);
		});

		test("should handle pagination correctly", async () => {
			vi.mocked(imagesQueryRepository.findMany).mockResolvedValue([]);

			await getExportedImages(3);

			expect(imagesQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				{
					skip: 48,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["testuserid_images"] },
				},
			);
		});

		test("should handle empty results", async () => {
			vi.mocked(imagesQueryRepository.findMany).mockResolvedValue([]);

			const result = await getExportedImages(1);

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(imagesQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedImages(1)).rejects.toThrow("Database error");
		});
	});

	describe("getUnexportedImages", () => {
		test("should fetch unexported images correctly", async () => {
			const mockImages = [
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d"),
					path: makePath("unexported1.jpg", false),
					height: makePixel(300),
					width: makePixel(400),
				},
				{
					id: makeId("01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7e"),
					path: makePath("unexported2.jpg", false),
					height: makePixel(350),
					width: makePixel(450),
				},
			];

			vi.mocked(imagesQueryRepository.findMany).mockResolvedValue(mockImages);

			const result = await getUnexportedImages(1);

			expect(imagesQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
				{
					skip: 0,
					take: 24,
					orderBy: {
						createdAt: "desc",
					},
					cacheStrategy: undefined,
				},
			);

			expect(result).toEqual([
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7d",
					originalPath: "/api/images/original/unexported1.jpg",
					thumbnailPath: "/api/images/thumbnail/unexported1.jpg",
					height: 300,
					width: 400,
				},
				{
					id: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7e",
					originalPath: "/api/images/original/unexported2.jpg",
					thumbnailPath: "/api/images/thumbnail/unexported2.jpg",
					height: 350,
					width: 450,
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(imagesQueryRepository.findMany).mockResolvedValue([]);

			const result = await getUnexportedImages(1);

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(imagesQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedImages(1)).rejects.toThrow("Database error");
		});
	});

	describe("getImagesCount", () => {
		test("should return count of images by status", async () => {
			vi.mocked(imagesQueryRepository.count).mockResolvedValue(25);

			const result = await getImagesCount("EXPORTED");

			expect(imagesQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
			);
			expect(result).toEqual(25);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(imagesQueryRepository.count).mockResolvedValue(0);

			const result = await getImagesCount("UNEXPORTED");

			expect(result).toEqual(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(imagesQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getImagesCount("EXPORTED")).rejects.toThrow(
				"Database error",
			);
		});
	});

	describe("getImageFromStorage", () => {
		test("should fetch image from storage with correct path and thumbnail flag", async () => {
			const mockStream = {} as NodeJS.ReadableStream;

			vi.mocked(minioStorageService.getImage).mockResolvedValue(mockStream);

			const result = await getImagesFromStorage("test-image-key.jpg", false);

			expect(minioStorageService.getImage).toHaveBeenCalledWith(
				"test-image-key.jpg",
				false,
			);

			expect(result).toBe(mockStream);
		});

		test("should handle storage errors", async () => {
			vi.mocked(minioStorageService.getImage).mockRejectedValue(
				new Error("Storage error"),
			);

			await expect(getImagesFromStorage("test-key", false)).rejects.toThrow(
				"Storage error",
			);
		});
	});
});
