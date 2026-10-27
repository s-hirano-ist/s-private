import { createObjectStorageClient } from "@s-hirano-ist/s-storage";
import { StorageOperationError } from "@s-hirano-ist/s-storage";
import { Readable } from "node:stream";
import { createImagesStorageService } from "s-private-backend/shared/images-storage-service";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
const storageClient = createObjectStorageClient({
	endpoint: "http://localhost:9000",
	region: "us-east-1",
	forcePathStyle: true,
	accessKeyId: "local-access-key",
	secretAccessKey: "local-secret-key",
});
for (const method of [
	"putObject",
	"getObject",
	"statObject",
	"removeObject",
] as const)
	vi.spyOn(storageClient, method).mockRejectedValue(
		new Error("unconfigured storage mock"),
	);
const minioStorageService = createImagesStorageService(
	storageClient,
	"test-bucket",
);

describe("MinioStorageService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("uploadImage", () => {
		test("should upload original image to storage successfully", async () => {
			const buffer = Buffer.from("test image data");
			const path = "image-123.png";

			vi.mocked(storageClient.putObject).mockResolvedValue({
				etag: "test-etag",
				versionId: "test-version",
			});

			await minioStorageService.uploadImage(path, buffer, false);

			expect(storageClient.putObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
				buffer,
			);
		});

		test("should upload thumbnail image to storage successfully", async () => {
			const buffer = Buffer.from("test thumbnail data");
			const path = "image-123.png";

			vi.mocked(storageClient.putObject).mockResolvedValue({
				etag: "test-etag",
				versionId: "test-version",
			});

			await minioStorageService.uploadImage(path, buffer, true);

			expect(storageClient.putObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/thumbnail/${path}`,
				buffer,
			);
		});

		test("should handle storage upload errors", async () => {
			const buffer = Buffer.from("test image data");
			const path = "image-123.png";

			vi.mocked(storageClient.putObject).mockRejectedValue(
				new Error("Storage upload failed"),
			);

			const upload = minioStorageService.uploadImage(path, buffer, false);

			await expect(upload).rejects.toThrow(StorageOperationError);
			await expect(upload).rejects.toMatchObject({
				context: {
					operation: "uploadImage",
					bucketName: "test-bucket",
					objectKey: `images/original/${path}`,
					isThumbnail: false,
				},
			});

			expect(storageClient.putObject).toHaveBeenCalledWith(
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

			vi.mocked(storageClient.getObject).mockResolvedValue(mockStream);

			const result = await minioStorageService.getImage(path, false);

			expect(storageClient.getObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
			);
			expect(result).toBe(mockStream);
		});

		test("should get thumbnail image from storage successfully", async () => {
			const mockStream = new Readable();
			const path = "image-123.png";

			vi.mocked(storageClient.getObject).mockResolvedValue(mockStream);

			const result = await minioStorageService.getImage(path, true);

			expect(storageClient.getObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/thumbnail/${path}`,
			);
			expect(result).toBe(mockStream);
		});

		test("should handle storage errors", async () => {
			const path = "nonexistent.png";

			vi.mocked(storageClient.getObject).mockRejectedValue(
				new Error("Object not found"),
			);

			await expect(minioStorageService.getImage(path, false)).rejects.toThrow(
				StorageOperationError,
			);

			expect(storageClient.getObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
			);
		});
	});

	describe("getImageOrThrow", () => {
		test("should verify image exists in storage", async () => {
			const path = "image-123.png";

			vi.mocked(storageClient.statObject).mockResolvedValue({
				size: 1024,
				etag: "test-etag",
				lastModified: new Date("2024-01-01"),
				metaData: {},
			});

			await minioStorageService.getImageOrThrow(path, false);

			expect(storageClient.statObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
			);
		});

		test("should throw when image does not exist", async () => {
			const path = "nonexistent.png";

			vi.mocked(storageClient.statObject).mockRejectedValue(
				new Error("Object not found"),
			);

			await expect(
				minioStorageService.getImageOrThrow(path, false),
			).rejects.toThrow(StorageOperationError);
		});
	});

	describe("deleteImage", () => {
		test("should delete original image from storage", async () => {
			const path = "image-123.png";

			vi.mocked(storageClient.removeObject).mockResolvedValue(undefined);

			await minioStorageService.deleteImage(path, false);

			expect(storageClient.removeObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/original/${path}`,
			);
		});

		test("should delete thumbnail image from storage", async () => {
			const path = "image-123.png";

			vi.mocked(storageClient.removeObject).mockResolvedValue(undefined);

			await minioStorageService.deleteImage(path, true);

			expect(storageClient.removeObject).toHaveBeenCalledWith(
				"test-bucket",
				`images/thumbnail/${path}`,
			);
		});

		test("should handle delete errors", async () => {
			const path = "image-123.png";

			vi.mocked(storageClient.removeObject).mockRejectedValue(
				new Error("Delete failed"),
			);

			await expect(
				minioStorageService.deleteImage(path, false),
			).rejects.toThrow(StorageOperationError);
		});
	});
});
