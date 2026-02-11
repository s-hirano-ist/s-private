import type {
	ContentType,
	FileSize,
	Path,
} from "@s-hirano-ist/s-core/images/entities/image-entity";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";
import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";
import { addImage } from "./add-image";
import { parseAddImageFormData } from "./helpers/form-data-parser";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

vi.mock(
	"@/infrastructures/images/repositories/images-command-repository",
	() => ({
		imagesCommandRepository: { create: vi.fn() },
	}),
);

vi.mock(
	"@/infrastructures/images/repositories/images-query-repository",
	() => ({ imagesQueryRepository: { findByPath: vi.fn() } }),
);

vi.mock("@/infrastructures/shared/storage/minio-storage-service", () => ({
	minioStorageService: { uploadImage: vi.fn() },
}));

vi.mock("./helpers/form-data-parser", () => ({
	parseAddImageFormData: vi.fn(),
}));

const createMockFile = (name: string, type: string, size: number): File => {
	const file = new File([new Uint8Array([0x00])], name, { type });
	Object.defineProperty(file, "size", { value: size });
	Object.defineProperty(file, "arrayBuffer", {
		value: async () => new ArrayBuffer(size),
	});
	return file;
};

describe("addImage", () => {
	let mockFormData: FormData;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return success false on Unauthorized", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);

		const result = await addImage(mockFormData);
		expect(result.success).toBe(false);
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addImage(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should return success false on not permitted", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addImage(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should return success when everything is correct", async () => {
		const validFileType = "image/jpeg";
		const validFileSize = 1024 * 1024; // 1MB
		const file = createMockFile("myImage.jpeg", validFileType, validFileSize);
		mockFormData = new FormData();
		mockFormData.append("file", file);

		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-id"));
		vi.mocked(parseAddImageFormData).mockResolvedValue({
			userId: makeUserId("user-id"),
			path: "myImage.jpeg" as Path,
			contentType: "image/jpeg" as ContentType,
			fileSize: validFileSize as FileSize,
			originalBuffer: Buffer.from([]),
			thumbnailBuffer: Buffer.from([]),
		});
		vi.mocked(imagesQueryRepository.findByPath).mockResolvedValue(null);
		vi.mocked(imagesCommandRepository.create).mockResolvedValue();
		vi.mocked(minioStorageService.uploadImage).mockResolvedValue();

		const result = await addImage(mockFormData);

		expect(minioStorageService.uploadImage).toHaveBeenCalledTimes(2);
		expect(imagesCommandRepository.create).toHaveBeenCalled();
		expect(result).toEqual({
			success: true,
			message: "inserted",
		});
	});

	test("should return success false on invalid file type", async () => {
		const validFileType = "invalid";
		const validFileSize = 1024 * 1024; // 1MB
		const file = createMockFile("myImage.jpeg", validFileType, validFileSize);
		mockFormData = new FormData();
		mockFormData.append("file", file);

		vi.clearAllMocks();
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-id"));
		vi.mocked(parseAddImageFormData).mockRejectedValue(
			new Error("Invalid content type"),
		);

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});

	test("should return success false on max file size", async () => {
		const validFileType = "image/jpeg";
		const validFileSize = 10_240 * 10_240 + 1; // 100MB over
		const file = createMockFile("myImage.jpeg", validFileType, validFileSize);
		mockFormData = new FormData();
		mockFormData.append("file", file);

		vi.clearAllMocks();
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-id"));
		vi.mocked(parseAddImageFormData).mockRejectedValue(
			new Error("File size too large"),
		);

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});

	test("should return success false on no file", async () => {
		mockFormData = new FormData();

		vi.clearAllMocks();
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-id"));
		vi.mocked(parseAddImageFormData).mockRejectedValue(
			new Error("No file provided"),
		);

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});
});
