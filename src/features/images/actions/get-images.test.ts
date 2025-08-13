import { beforeEach, describe, expect, test, vi } from "vitest";
import { imageQueryRepository } from "@/features/images/repositories/image-query-repository";
import {
	getExportedImages,
	getImageFromStorage,
	getImagesCount,
	getUnexportedImages,
} from "./get-images";

vi.mock("@/features/images/repositories/image-query-repository", () => ({
	imageQueryRepository: {
		findMany: vi.fn(),
		count: vi.fn(),
		getFromStorage: vi.fn(),
	},
}));

vi.mock("@/utils/auth/session", () => ({
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
					id: "1",
					title: "Test Image 1",
					url: "https://example1.com/image1.jpg",
					objKey: "image1.jpg",
				},
				{
					id: "2",
					title: "Test Image 2",
					url: "https://example2.com/image2.jpg",
					objKey: "image2.jpg",
				},
			];

			vi.mocked(imageQueryRepository.findMany).mockResolvedValue(mockImages);

			const result = await getExportedImages(1);

			expect(imageQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				{
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["images"] },
				},
			);

			expect(result).toEqual(mockImages);
		});

		test("should handle pagination correctly", async () => {
			vi.mocked(imageQueryRepository.findMany).mockResolvedValue([]);

			await getExportedImages(3);

			expect(imageQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				{
					skip: 48,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["images"] },
				},
			);
		});

		test("should handle empty results", async () => {
			vi.mocked(imageQueryRepository.findMany).mockResolvedValue([]);

			const result = await getExportedImages(1);

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(imageQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedImages(1)).rejects.toThrow("Database error");
		});
	});

	describe("getUnexportedImages", () => {
		test("should fetch unexported images correctly", async () => {
			const mockImages = [
				{
					id: "1",
					title: "Unexported Image 1",
					url: "https://example1.com/image1.jpg",
					objKey: "image1.jpg",
				},
				{
					id: "2",
					title: "Unexported Image 2",
					url: "https://example2.com/image2.jpg",
					objKey: "image2.jpg",
				},
			];

			vi.mocked(imageQueryRepository.findMany).mockResolvedValue(mockImages);

			const result = await getUnexportedImages();

			expect(imageQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
				{
					orderBy: {
						createdAt: "desc",
					},
				},
			);

			expect(result).toEqual(mockImages);
		});

		test("should handle empty results", async () => {
			vi.mocked(imageQueryRepository.findMany).mockResolvedValue([]);

			const result = await getUnexportedImages();

			expect(result).toEqual([]);
		});

		test("should handle database errors", async () => {
			vi.mocked(imageQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedImages()).rejects.toThrow("Database error");
		});
	});

	describe("getImagesCount", () => {
		test("should return count of images by status", async () => {
			vi.mocked(imageQueryRepository.count).mockResolvedValue(25);

			const result = await getImagesCount("EXPORTED");

			expect(imageQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
			);
			expect(result).toBe(25);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(imageQueryRepository.count).mockResolvedValue(0);

			const result = await getImagesCount("UNEXPORTED");

			expect(result).toBe(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(imageQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getImagesCount("EXPORTED")).rejects.toThrow(
				"Database error",
			);
		});
	});

	describe("getImageFromStorage", () => {
		test("should fetch image from storage with correct objKey", async () => {
			const mockImageData = {
				data: Buffer.from("fake-image-data"),
				contentType: "image/jpeg",
			};

			vi.mocked(imageQueryRepository.getFromStorage).mockResolvedValue(
				mockImageData,
			);

			const result = await getImageFromStorage("test-image-key.jpg");

			expect(imageQueryRepository.getFromStorage).toHaveBeenCalledWith(
				"test-image-key.jpg",
			);

			expect(result).toEqual(mockImageData);
		});

		test("should handle storage errors", async () => {
			vi.mocked(imageQueryRepository.getFromStorage).mockRejectedValue(
				new Error("Storage error"),
			);

			await expect(getImageFromStorage("test-key")).rejects.toThrow(
				"Storage error",
			);
		});

		test("should handle missing image", async () => {
			vi.mocked(imageQueryRepository.getFromStorage).mockResolvedValue(null);

			const result = await getImageFromStorage("missing-key");

			expect(result).toBeNull();
		});
	});
});
