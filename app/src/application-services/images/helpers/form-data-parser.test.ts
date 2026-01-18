import {
	makeContentType,
	makeFileSize,
	makePath,
} from "@s-hirano-ist/s-core/images/entities/image-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getFormDataFile } from "@/common/utils/form-data-utils";
import { sharpImageProcessor } from "@/infrastructures/images/services/sharp-image-processor";
import { parseAddImageFormData } from "./form-data-parser";

vi.mock("@/common/utils/form-data-utils");
vi.mock("@s-hirano-ist/s-core/images/entities/image-entity");
vi.mock("@/infrastructures/images/services/sharp-image-processor");

const mockGetFormDataFile = vi.mocked(getFormDataFile);
const mockMakePath = vi.mocked(makePath);
const mockMakeContentType = vi.mocked(makeContentType);
const mockMakeFileSize = vi.mocked(makeFileSize);
const mockFileToBuffer = vi.mocked(sharpImageProcessor.fileToBuffer);
const mockCreateThumbnail = vi.mocked(sharpImageProcessor.createThumbnail);

describe("parseAddImageFormData", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should parse form data and create image data", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		const mockFile = {
			name: "test-image.png",
			type: "image/png",
			size: 1024,
		} as File;

		const mockOriginalBuffer = Buffer.from("original-image-data");
		const mockThumbnailBuffer = Buffer.from("thumbnail-image-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("test-image.png" as any);
		mockMakeContentType.mockReturnValue("image/png" as any);
		mockMakeFileSize.mockReturnValue(1024 as any);
		mockFileToBuffer.mockResolvedValue(mockOriginalBuffer);
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(mockGetFormDataFile).toHaveBeenCalledWith(formData, "file");

		expect(mockMakePath).toHaveBeenCalledWith("test-image.png", true);
		expect(mockMakeContentType).toHaveBeenCalledWith("image/png");
		expect(mockMakeFileSize).toHaveBeenCalledWith(1024);
		expect(mockFileToBuffer).toHaveBeenCalledWith(mockFile);
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
		const userId = "test-user-id" as any;

		const mockFile = {
			name: "photo.jpg",
			type: "image/jpeg",
			size: 1024,
		} as File;

		const mockOriginalBuffer = Buffer.from("jpeg-original-data");
		const mockThumbnailBuffer = Buffer.from("jpeg-thumbnail-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("photo.jpg" as any);
		mockMakeContentType.mockReturnValue("image/jpeg" as any);
		mockMakeFileSize.mockReturnValue(1024 as any);
		mockFileToBuffer.mockResolvedValue(mockOriginalBuffer);
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

	test("should handle image with Japanese filename", async () => {
		const formData = new FormData();
		const userId = "test-user-id-jp" as any;

		const mockFile = {
			name: "テスト画像.png",
			type: "image/png",
			size: 1536,
		} as File;

		const mockOriginalBuffer = Buffer.from("japanese-original-data");
		const mockThumbnailBuffer = Buffer.from("japanese-thumbnail-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("テスト画像.png" as any);
		mockMakeContentType.mockReturnValue("image/png" as any);
		mockMakeFileSize.mockReturnValue(1536 as any);
		mockFileToBuffer.mockResolvedValue(mockOriginalBuffer);
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(mockMakePath).toHaveBeenCalledWith("テスト画像.png", true);
		expect(result.path).toBe("テスト画像.png");
		expect(result.userId).toBe("test-user-id-jp");
	});

	test("should handle large image file", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		const mockFile = {
			name: "large-image.png",
			type: "image/png",
			size: 5242880, // 5MB
		} as File;

		const mockOriginalBuffer = Buffer.from("large-original-data");
		const mockThumbnailBuffer = Buffer.from("large-thumbnail-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("large-image.png" as any);
		mockMakeContentType.mockReturnValue("image/png" as any);
		mockMakeFileSize.mockReturnValue(5242880 as any);
		mockFileToBuffer.mockResolvedValue(mockOriginalBuffer);
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(result.fileSize).toBe(5242880);
		expect(mockMakeFileSize).toHaveBeenCalledWith(5242880);
	});

	test("should handle file with special characters in name", async () => {
		const formData = new FormData();
		const userId = "test-user-id" as any;

		const mockFile = {
			name: "image with spaces & symbols (1).png",
			type: "image/png",
			size: 1024,
		} as File;

		const mockOriginalBuffer = Buffer.from("special-original-data");
		const mockThumbnailBuffer = Buffer.from("special-thumbnail-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("image with spaces & symbols (1).png" as any);
		mockMakeContentType.mockReturnValue("image/png" as any);
		mockMakeFileSize.mockReturnValue(1024 as any);
		mockFileToBuffer.mockResolvedValue(mockOriginalBuffer);
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
		const userId = "different-user-789" as any;

		const mockFile = {
			name: "user-image.jpg",
			type: "image/jpeg",
			size: 1024,
		} as File;

		const mockOriginalBuffer = Buffer.from("user-original-data");
		const mockThumbnailBuffer = Buffer.from("user-thumbnail-data");

		// Mock form data extraction
		mockGetFormDataFile.mockReturnValue(mockFile);

		// Mock entity creation
		mockMakePath.mockReturnValue("user-image.jpg" as any);
		mockMakeContentType.mockReturnValue("image/jpeg" as any);
		mockMakeFileSize.mockReturnValue(1024 as any);
		mockFileToBuffer.mockResolvedValue(mockOriginalBuffer);
		mockCreateThumbnail.mockResolvedValue(mockThumbnailBuffer);

		const result = await parseAddImageFormData(formData, userId);

		expect(result.userId).toBe("different-user-789");
	});
});
