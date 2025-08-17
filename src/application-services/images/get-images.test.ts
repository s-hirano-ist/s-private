import { beforeEach, describe, expect, test, vi } from "vitest";
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
			getFromStorage: vi.fn(),
		},
	}),
);

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
					path: "image1.jpg",
					id: "1",
					height: 100,
					width: 200,
				},
				{
					path: "image2.jpg",
					id: "2",
					height: 150,
					width: 250,
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
					cacheStrategy: { ttl: 400, swr: 40, tags: ["testuserid-images"] },
				},
			);

			expect(result).toEqual([
				{
					id: "1",
					originalPath: "/api/images/original/image1.jpg",
					thumbnailPath: "/api/images/thumbnail/image1.jpg",
					height: 100,
					width: 200,
				},
				{
					id: "2",
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
					cacheStrategy: { ttl: 400, swr: 40, tags: ["testuserid-images"] },
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
					path: "unexported1.jpg",
					id: "1",
					height: 300,
					width: 400,
				},
				{
					path: "unexported2.jpg",
					id: "2",
					height: 350,
					width: 450,
				},
			];

			vi.mocked(imagesQueryRepository.findMany).mockResolvedValue(mockImages);

			const result = await getUnexportedImages();

			expect(imagesQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
				{
					orderBy: {
						createdAt: "desc",
					},
				},
			);

			expect(result).toEqual([
				{
					id: "1",
					originalPath: "/api/images/original/unexported1.jpg",
					thumbnailPath: "/api/images/thumbnail/unexported1.jpg",
					height: 300,
					width: 400,
				},
				{
					id: "2",
					originalPath: "/api/images/original/unexported2.jpg",
					thumbnailPath: "/api/images/thumbnail/unexported2.jpg",
					height: 350,
					width: 450,
				},
			]);
		});

		test("should handle empty results", async () => {
			vi.mocked(imagesQueryRepository.findMany).mockResolvedValue([]);

			const result = await getUnexportedImages();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(imagesQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedImages()).rejects.toThrow("Database error");
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
			expect(result).toEqual({ count: 25, pageSize: 24 });
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(imagesQueryRepository.count).mockResolvedValue(0);

			const result = await getImagesCount("UNEXPORTED");

			expect(result).toEqual({ count: 0, pageSize: 24 });
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

			vi.mocked(imagesQueryRepository.getFromStorage).mockResolvedValue(
				mockStream,
			);

			const result = await getImagesFromStorage("test-image-key.jpg", false);

			expect(imagesQueryRepository.getFromStorage).toHaveBeenCalledWith(
				"test-image-key.jpg",
				false,
			);

			expect(result).toBe(mockStream);
		});

		test("should handle storage errors", async () => {
			vi.mocked(imagesQueryRepository.getFromStorage).mockRejectedValue(
				new Error("Storage error"),
			);

			await expect(getImagesFromStorage("test-key", false)).rejects.toThrow(
				"Storage error",
			);
		});
	});
});
