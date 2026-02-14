import { Readable } from "node:stream";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { minioClient } from "@/minio";
import { minioStorageService } from "./minio-storage-service";

describe("MinioStorageService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("uploadImage", () => {
		test("should upload original image to storage successfully", async () => {
			const buffer = Buffer.from("test image data");
			const path = "image-123.png";

			vi.mocked(minioClient.putObject).mockResolvedValue({
				etag: "test-etag",
				versionId: "test-version",
			});

			await minioStorageService.uploadImage(path, buffer, false);

			expect(minioClient.putObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
				buffer,
			);
		});

		test("should upload thumbnail image to storage successfully", async () => {
			const buffer = Buffer.from("test thumbnail data");
			const path = "image-123.png";

			vi.mocked(minioClient.putObject).mockResolvedValue({
				etag: "test-etag",
				versionId: "test-version",
			});

			await minioStorageService.uploadImage(path, buffer, true);

			expect(minioClient.putObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/thumbnail/${path}`,
				buffer,
			);
		});

		test("should handle storage upload errors", async () => {
			const buffer = Buffer.from("test image data");
			const path = "image-123.png";

			vi.mocked(minioClient.putObject).mockRejectedValue(
				new Error("Storage upload failed"),
			);

			await expect(
				minioStorageService.uploadImage(path, buffer, false),
			).rejects.toThrow("Storage upload failed");

			expect(minioClient.putObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
				buffer,
			);
		});
	});

	describe("getImage", () => {
		test("should get original image from storage successfully", async () => {
			const mockStream = new Readable();
			const path = "image-123.png";

			vi.mocked(minioClient.getObject).mockResolvedValue(mockStream);

			const result = await minioStorageService.getImage(path, false);

			expect(minioClient.getObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
			);
			expect(result).toBe(mockStream);
		});

		test("should get thumbnail image from storage successfully", async () => {
			const mockStream = new Readable();
			const path = "image-123.png";

			vi.mocked(minioClient.getObject).mockResolvedValue(mockStream);

			const result = await minioStorageService.getImage(path, true);

			expect(minioClient.getObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/thumbnail/${path}`,
			);
			expect(result).toBe(mockStream);
		});

		test("should handle storage errors", async () => {
			const path = "nonexistent.png";

			vi.mocked(minioClient.getObject).mockRejectedValue(
				new Error("Object not found"),
			);

			await expect(minioStorageService.getImage(path, false)).rejects.toThrow(
				"Object not found",
			);

			expect(minioClient.getObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
			);
		});
	});

	describe("getImageOrThrow", () => {
		test("should verify image exists in storage", async () => {
			const path = "image-123.png";

			vi.mocked(minioClient.statObject).mockResolvedValue({
				size: 1024,
				etag: "test-etag",
				lastModified: new Date("2024-01-01"),
				metaData: {},
			});

			await minioStorageService.getImageOrThrow(path, false);

			expect(minioClient.statObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
			);
		});

		test("should throw when image does not exist", async () => {
			const path = "nonexistent.png";

			vi.mocked(minioClient.statObject).mockRejectedValue(
				new Error("Object not found"),
			);

			await expect(
				minioStorageService.getImageOrThrow(path, false),
			).rejects.toThrow("Object not found");
		});
	});

	describe("deleteImage", () => {
		test("should delete original image from storage", async () => {
			const path = "image-123.png";

			vi.mocked(minioClient.removeObject).mockResolvedValue();

			await minioStorageService.deleteImage(path, false);

			expect(minioClient.removeObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
			);
		});

		test("should delete thumbnail image from storage", async () => {
			const path = "image-123.png";

			vi.mocked(minioClient.removeObject).mockResolvedValue();

			await minioStorageService.deleteImage(path, true);

			expect(minioClient.removeObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/thumbnail/${path}`,
			);
		});

		test("should handle delete errors", async () => {
			const path = "image-123.png";

			vi.mocked(minioClient.removeObject).mockRejectedValue(
				new Error("Delete failed"),
			);

			await expect(
				minioStorageService.deleteImage(path, false),
			).rejects.toThrow("Delete failed");
		});
	});
});
