import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { v7 as uuidv7 } from "uuid";
import { describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";
import { addImage } from "./add-image";

vi.mock("@/common/auth/session", () => ({
	hasDumperPostPermission: vi.fn(),
	getSelfId: vi.fn(),
}));

vi.mock(
	"@/infrastructures/images/repositories/images-command-repository",
	() => ({
		imagesCommandRepository: {
			create: vi.fn(),
			uploadToStorage: vi.fn(),
		},
	}),
);

vi.mock(
	"@/infrastructures/images/repositories/images-query-repository",
	() => ({
		imagesQueryRepository: {
			findByPath: vi.fn(),
		},
	}),
);

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

	test("should return success false on Unauthorized", async () => {
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

		// Clear any previous mocks
		vi.clearAllMocks();

		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-id");
		vi.mocked(imagesQueryRepository.findByPath).mockResolvedValue(null);
		vi.mocked(imagesCommandRepository.create).mockResolvedValue();
		vi.mocked(imagesCommandRepository.uploadToStorage).mockResolvedValue();
		vi.mocked(uuidv7).mockReturnValue("generated-uuid");

		const result = await addImage(mockFormData);

		expect(imagesCommandRepository.uploadToStorage).toHaveBeenCalledTimes(2);
		expect(imagesCommandRepository.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
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
		vi.mocked(getSelfId).mockResolvedValue("user-id");
		vi.mocked(uuidv7).mockReturnValue("generated-uuid");

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "invalidFileFormat",
			formData: {},
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
		vi.mocked(getSelfId).mockResolvedValue("user-id");
		vi.mocked(uuidv7).mockReturnValue("generated-uuid");

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "invalidFileFormat",
			formData: {},
		});
	});

	test("should return success false on no file", async () => {
		mockFormData = new FormData();

		vi.clearAllMocks();
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-id");
		vi.mocked(uuidv7).mockReturnValue("generated-uuid");

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
			formData: {},
		});
	});
});
