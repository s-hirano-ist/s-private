import { getFormDataFile } from "@/common/utils/form-data-utils";
import { photonImageProcessor } from "@/infrastructures/images/services/photon-image-processor";
import {
	type ContentType,
	type FileSize,
	makeContentType,
	makeFileSize,
	makePath,
	type Path,
} from "@s-hirano-ist/s-core/images/entities/image-entity";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { FileNotAllowedError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { parseAddImageFormData } from "./form-data-parser";

vi.mock("@/common/utils/form-data-utils");
vi.mock("@s-hirano-ist/s-core/images/entities/image-entity");
vi.mock("@/infrastructures/images/services/photon-image-processor");

const mockGetFormDataFile = vi.mocked(getFormDataFile);
const mockMakePath = vi.mocked(makePath);
const mockMakeContentType = vi.mocked(makeContentType);
const mockMakeFileSize = vi.mocked(makeFileSize);
const mockFileToBytes = vi.mocked(photonImageProcessor.fileToBytes);
const mockGetMetadata = vi.mocked(photonImageProcessor.getMetadata);
const mockCreateThumbnail = vi.mocked(photonImageProcessor.createThumbnail);

const JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xdb]);
const PNG_BUFFER = Buffer.from([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const UNKNOWN_BUFFER = Buffer.from("not-an-image");

describe("parseAddImageFormData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetMetadata.mockResolvedValue({ format: "png" });
	});

	test("should parse form data and create image data", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");

		const mockFile = {
			name: "test-image.png",
			type: "image/png",
			size: 1024,
		} as File;

		const mockOriginalBuffer = PNG_BUFFER;
		const mockThumbnailBuffer = Buffer.from("thumbnail-image-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("test-image.png" as Path);
		mockMakeContentType.mockReturnValue("image/png" as ContentType);
		mockMakeFileSize.mockReturnValue(1024 as FileSize);
		mockFileToBytes.mockResolvedValue(mockOriginalBuffer);
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(mockGetFormDataFile).toHaveBeenCalledWith(formData, "file");

		expect(mockMakePath).toHaveBeenCalledWith("test-image.png", true);
		expect(mockMakeContentType).toHaveBeenCalledWith("image/png");
		expect(mockMakeFileSize).toHaveBeenCalledWith(1024);
		expect(mockFileToBytes).toHaveBeenCalledWith(mockFile);
		expect(mockCreateThumbnail).toHaveBeenCalledWith(
			mockOriginalBuffer,
			192,
			192,
		);

		expect(result).toEqual({
			userId: "test-user-id",
			path: "test-image.png",
			contentType: "image/png",
			fileSize: 1024,
			originalBuffer: mockOriginalBuffer,
			thumbnailBuffer: mockThumbnailBuffer,
		});
	});

	test("should handle JPEG image file", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");

		const mockFile = {
			name: "photo.jpg",
			type: "image/jpeg",
			size: 1024,
		} as File;

		const mockOriginalBuffer = JPEG_BUFFER;
		const mockThumbnailBuffer = Buffer.from("jpeg-thumbnail-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("photo.jpg" as Path);
		mockMakeContentType.mockReturnValue("image/jpeg" as ContentType);
		mockMakeFileSize.mockReturnValue(1024 as FileSize);
		mockFileToBytes.mockResolvedValue(mockOriginalBuffer);
		mockGetMetadata.mockResolvedValue({ format: "jpeg" });
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(mockMakePath).toHaveBeenCalledWith("photo.jpg", true);
		expect(mockMakeContentType).toHaveBeenCalledWith("image/jpeg");
		expect(mockMakeFileSize).toHaveBeenCalledWith(1024);

		expect(result).toEqual({
			userId: "test-user-id",
			path: "photo.jpg",
			contentType: "image/jpeg",
			fileSize: 1024,
			originalBuffer: mockOriginalBuffer,
			thumbnailBuffer: mockThumbnailBuffer,
		});
	});

	test("should accept JPEG image when browser does not provide content type", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");
		const mockFile = {
			name: "photo.jpg",
			type: "",
			size: 1024,
		} as File;
		const mockOriginalBuffer = JPEG_BUFFER;
		const mockThumbnailBuffer = Buffer.from("jpeg-thumbnail-data");

		mockGetFormDataFile.mockReturnValue(mockFile);
		mockMakePath.mockReturnValue("photo.jpg" as Path);
		mockMakeContentType.mockReturnValue("image/jpeg" as ContentType);
		mockMakeFileSize.mockReturnValue(1024 as FileSize);
		mockFileToBytes.mockResolvedValue(mockOriginalBuffer);
		mockGetMetadata.mockResolvedValue({ format: "jpeg" });
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(mockMakeContentType).toHaveBeenCalledWith("image/jpeg");
		expect(mockCreateThumbnail).toHaveBeenCalledWith(
			mockOriginalBuffer,
			192,
			192,
		);
		expect(result.contentType).toBe("image/jpeg");
	});

	test("should accept JPEG image when browser sends generic content type", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");
		const mockFile = {
			name: "photo.jpg",
			type: "application/octet-stream",
			size: 1024,
		} as File;
		const mockOriginalBuffer = JPEG_BUFFER;
		const mockThumbnailBuffer = Buffer.from("octet-thumbnail-data");

		mockGetFormDataFile.mockReturnValue(mockFile);
		mockMakePath.mockReturnValue("photo.jpg" as Path);
		mockMakeContentType.mockReturnValue("image/jpeg" as ContentType);
		mockMakeFileSize.mockReturnValue(1024 as FileSize);
		mockFileToBytes.mockResolvedValue(mockOriginalBuffer);
		mockGetMetadata.mockResolvedValue({ format: "jpeg" });
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(mockMakeContentType).toHaveBeenCalledWith("image/jpeg");
		expect(result.contentType).toBe("image/jpeg");
	});

	test("should handle image with Japanese filename", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id-jp");

		const mockFile = {
			name: "テスト画像.png",
			type: "image/png",
			size: 1536,
		} as File;

		const mockOriginalBuffer = PNG_BUFFER;
		const mockThumbnailBuffer = Buffer.from("japanese-thumbnail-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("テスト画像.png" as Path);
		mockMakeContentType.mockReturnValue("image/png" as ContentType);
		mockMakeFileSize.mockReturnValue(1536 as FileSize);
		mockFileToBytes.mockResolvedValue(mockOriginalBuffer);
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(mockMakePath).toHaveBeenCalledWith("テスト画像.png", true);
		expect(result.path).toBe("テスト画像.png");
		expect(result.userId).toBe("test-user-id-jp");
	});

	test("should handle large image file", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");

		const mockFile = {
			name: "large-image.png",
			type: "image/png",
			size: 5242880, // 5MB
		} as File;

		const mockOriginalBuffer = PNG_BUFFER;
		const mockThumbnailBuffer = Buffer.from("large-thumbnail-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("large-image.png" as Path);
		mockMakeContentType.mockReturnValue("image/png" as ContentType);
		mockMakeFileSize.mockReturnValue(5242880 as FileSize);
		mockFileToBytes.mockResolvedValue(mockOriginalBuffer);
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(result.fileSize).toBe(5242880);
		expect(mockMakeFileSize).toHaveBeenCalledWith(5242880);
	});

	test("should handle file with special characters in name", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");

		const mockFile = {
			name: "image with spaces & symbols (1).png",
			type: "image/png",
			size: 1024,
		} as File;

		const mockOriginalBuffer = PNG_BUFFER;
		const mockThumbnailBuffer = Buffer.from("special-thumbnail-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("image with spaces & symbols (1).png" as Path);
		mockMakeContentType.mockReturnValue("image/png" as ContentType);
		mockMakeFileSize.mockReturnValue(1024 as FileSize);
		mockFileToBytes.mockResolvedValue(mockOriginalBuffer);
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(mockMakePath).toHaveBeenCalledWith(
			"image with spaces & symbols (1).png",
			true,
		);
		expect(result.path).toBe("image with spaces & symbols (1).png");
	});

	test("should handle different user IDs", async () => {
		const formData = new FormData();
		const userId = makeUserId("different-user-789");

		const mockFile = {
			name: "user-image.jpg",
			type: "image/jpeg",
			size: 1024,
		} as File;

		const mockOriginalBuffer = JPEG_BUFFER;
		const mockThumbnailBuffer = Buffer.from("user-thumbnail-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("user-image.jpg" as Path);
		mockMakeContentType.mockReturnValue("image/jpeg" as ContentType);
		mockMakeFileSize.mockReturnValue(1024 as FileSize);
		mockFileToBytes.mockResolvedValue(mockOriginalBuffer);
		mockGetMetadata.mockResolvedValue({ format: "jpeg" });
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(result.userId).toBe("different-user-789");
	});

	test("should reject unsupported image signature before reading metadata", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");
		const mockFile = {
			name: "photo.avif",
			type: "image/avif",
			size: 1024,
		} as File;

		mockGetFormDataFile.mockReturnValue(mockFile);
		mockFileToBytes.mockResolvedValue(Buffer.from("ftypavif"));
		mockGetMetadata.mockResolvedValue({ format: "avif" });

		await expect(parseAddImageFormData(formData, userId)).rejects.toThrow(
			FileNotAllowedError,
		);
		expect(mockFileToBytes).toHaveBeenCalledWith(mockFile);
		expect(mockGetMetadata).not.toHaveBeenCalled();
		expect(mockCreateThumbnail).not.toHaveBeenCalled();
	});

	test("should reject when magic bytes and decoded metadata do not match", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");
		const mockFile = {
			name: "photo.jpg",
			type: "",
			size: 1024,
		} as File;

		mockGetFormDataFile.mockReturnValue(mockFile);
		mockFileToBytes.mockResolvedValue(JPEG_BUFFER);
		mockGetMetadata.mockResolvedValue({ format: "png" });

		await expect(parseAddImageFormData(formData, userId)).rejects.toThrow(
			FileNotAllowedError,
		);
		expect(mockCreateThumbnail).not.toHaveBeenCalled();
	});

	test("should reject image when metadata format is missing", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");
		const mockFile = {
			name: "photo.jpg",
			type: "",
			size: 1024,
		} as File;

		mockGetFormDataFile.mockReturnValue(mockFile);
		mockFileToBytes.mockResolvedValue(JPEG_BUFFER);
		mockGetMetadata.mockResolvedValue({});

		await expect(parseAddImageFormData(formData, userId)).rejects.toThrow(
			FileNotAllowedError,
		);
		expect(mockCreateThumbnail).not.toHaveBeenCalled();
	});

	test("should reject images image processor cannot read metadata from", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");
		const mockFile = {
			name: "photo.jpg",
			type: "image/jpeg",
			size: 1024,
		} as File;

		mockGetFormDataFile.mockReturnValue(mockFile);
		mockFileToBytes.mockResolvedValue(JPEG_BUFFER);
		mockGetMetadata.mockRejectedValue(
			new Error("Input buffer has corrupt header"),
		);

		await expect(parseAddImageFormData(formData, userId)).rejects.toThrow(
			FileNotAllowedError,
		);
		expect(mockCreateThumbnail).not.toHaveBeenCalled();
	});

	test("should reject images image processor cannot decode as invalid file format", async () => {
		const formData = new FormData();
		const userId = makeUserId("test-user-id");
		const mockFile = {
			name: "photo.jpeg",
			type: "image/jpeg",
			size: 1024,
		} as File;

		mockGetFormDataFile.mockReturnValue(mockFile);
		mockMakePath.mockReturnValue("photo.jpeg" as Path);
		mockMakeContentType.mockReturnValue("image/jpeg" as ContentType);
		mockMakeFileSize.mockReturnValue(1024 as FileSize);
		mockFileToBytes.mockResolvedValue(JPEG_BUFFER);
		mockGetMetadata.mockResolvedValue({ format: "jpeg" });
		mockCreateThumbnail.mockRejectedValue(
			new Error("Input buffer has corrupt header"),
		);

		await expect(parseAddImageFormData(formData, userId)).rejects.toThrow(
			FileNotAllowedError,
		);
	});
});
