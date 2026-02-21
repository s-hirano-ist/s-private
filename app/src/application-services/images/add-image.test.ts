import type {
	ContentType,
	FileSize,
	Path,
} from "@s-hirano-ist/s-core/images/entities/image-entity";
import type { IImagesCommandRepository } from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type { IStorageService } from "@s-hirano-ist/s-core/shared-kernel/services/storage-service.interface";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { addImage } from "./add-image";
import { addImageCore } from "./add-image.core";
import type { AddImageDeps } from "./add-image.deps";
import { parseAddImageFormData } from "./helpers/form-data-parser";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
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

function createMockDeps(
	ensureNoDuplicateImpl: () => Promise<void> = async () => {},
): {
	deps: AddImageDeps;
	mockCommandRepository: IImagesCommandRepository;
	mockStorageService: IStorageService;
	mockEnsureNoDuplicate: ReturnType<typeof vi.fn>;
	mockEventDispatcher: { dispatch: ReturnType<typeof vi.fn> };
} {
	const mockCommandRepository: IImagesCommandRepository = {
		create: vi.fn(),
		deleteById: vi.fn(),
	};

	const mockStorageService: IStorageService = {
		uploadImage: vi.fn(),
		getImage: vi.fn(),
		getImageOrThrow: vi.fn(),
		deleteImage: vi.fn(),
	};

	const mockEnsureNoDuplicate = vi
		.fn()
		.mockImplementation(ensureNoDuplicateImpl);

	const mockEventDispatcher = {
		dispatch: vi.fn().mockResolvedValue(undefined),
	};

	const mockDomainServiceFactory = {
		createImagesDomainService: () => ({
			ensureNoDuplicate: mockEnsureNoDuplicate,
		}),
		createArticlesDomainService: vi.fn(),
		createBooksDomainService: vi.fn(),
		createNotesDomainService: vi.fn(),
		createCategoryService: vi.fn(),
	};

	const deps: AddImageDeps = {
		commandRepository: mockCommandRepository,
		storageService: mockStorageService,
		domainServiceFactory:
			mockDomainServiceFactory as unknown as AddImageDeps["domainServiceFactory"],
		eventDispatcher: mockEventDispatcher,
	};

	return {
		deps,
		mockCommandRepository,
		mockStorageService,
		mockEnsureNoDuplicate,
		mockEventDispatcher,
	};
}

describe("addImageCore", () => {
	let mockFormData: FormData;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return success false on Unauthorized", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		const { deps } = createMockDeps();

		const result = await addImageCore(mockFormData, deps);

		expect(result.success).toBe(false);
	});

	test("should return success when everything is correct", async () => {
		const validFileType = "image/jpeg";
		const validFileSize = 1024 * 1024;
		const file = createMockFile("myImage.jpeg", validFileType, validFileSize);
		mockFormData = new FormData();
		mockFormData.append("file", file);

		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-id"));
		vi.mocked(parseAddImageFormData).mockResolvedValue({
			userId: makeUserId("user-id"),
			path: "myImage.jpeg" as Path,
			contentType: "image/jpeg" as ContentType,
			fileSize: validFileSize as FileSize,
			originalBuffer: Buffer.from([]),
			thumbnailBuffer: Buffer.from([]),
		});

		const {
			deps,
			mockCommandRepository,
			mockStorageService,
			mockEventDispatcher,
		} = createMockDeps();

		const result = await addImageCore(mockFormData, deps);

		expect(mockStorageService.uploadImage).toHaveBeenCalledTimes(2);
		expect(mockCommandRepository.create).toHaveBeenCalled();
		expect(mockEventDispatcher.dispatch).toHaveBeenCalled();
		expect(result).toEqual({
			success: true,
			message: "inserted",
		});
	});

	test("should return success false on invalid file type", async () => {
		const validFileType = "invalid";
		const validFileSize = 1024 * 1024;
		const file = createMockFile("myImage.jpeg", validFileType, validFileSize);
		mockFormData = new FormData();
		mockFormData.append("file", file);

		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-id"));
		vi.mocked(parseAddImageFormData).mockRejectedValue(
			new Error("Invalid content type"),
		);
		const { deps } = createMockDeps();

		const result = await addImageCore(mockFormData, deps);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});

	test("should return success false on max file size", async () => {
		const validFileType = "image/jpeg";
		const validFileSize = 10_240 * 10_240 + 1;
		const file = createMockFile("myImage.jpeg", validFileType, validFileSize);
		mockFormData = new FormData();
		mockFormData.append("file", file);

		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-id"));
		vi.mocked(parseAddImageFormData).mockRejectedValue(
			new Error("File size too large"),
		);
		const { deps } = createMockDeps();

		const result = await addImageCore(mockFormData, deps);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});

	test("should return success false on no file", async () => {
		mockFormData = new FormData();

		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-id"));
		vi.mocked(parseAddImageFormData).mockRejectedValue(
			new Error("No file provided"),
		);
		const { deps } = createMockDeps();

		const result = await addImageCore(mockFormData, deps);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});
});

describe("addImage (Server Action)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addImage(new FormData())).rejects.toThrow("FORBIDDEN");
	});

	test("should call addImageCore with default deps when permitted", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));

		const result = await addImage(new FormData());

		expect(hasDumperPostPermission).toHaveBeenCalled();
		expect(result.success).toBe(false);
	});
});
