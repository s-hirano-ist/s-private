import { revalidatePath } from "next/cache";
import { Session } from "next-auth";
import sharp from "sharp";
import { v7 as uuidv7 } from "uuid";
import { describe, expect, Mock, test, vi } from "vitest";
import { ImagesDomainService } from "@/domains/images/services/images-domain-service";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import { auth } from "@/utils/auth/auth";
import {
	FileNotAllowedError,
	UnexpectedError,
} from "@/utils/error/error-classes";
import { addImage } from "./add-image";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("sharp");
vi.mock("uuid");
vi.mock("@/utils/auth/auth");

vi.mock(
	"@/infrastructures/images/repositories/images-command-repository",
	() => ({
		imagesCommandRepository: {
			create: vi.fn(),
			uploadToStorage: vi.fn(),
		},
	}),
);

vi.mock("@/domains/images/services/images-domain-service", () => ({
	ImagesDomainService: vi.fn().mockImplementation(() => ({
		prepareNewImages: vi.fn(),
	})),
}));

const mockAllowedRoleSession: Session = {
	user: { id: "1", roles: ["dumper"] },
	expires: "2025-01-01",
};
const mockNotAllowedRoleSession: Session = {
	user: { id: "1", roles: [] },
	expires: "2025-01-01",
};
const mockUnauthorizedSession = null;

const createMockFile = (name: string, type: string, size: number): File => {
	const file = new File([new Uint8Array([0x00])], name, { type });
	Object.defineProperty(file, "size", { value: size });
	Object.defineProperty(file, "arrayBuffer", {
		value: async () => new ArrayBuffer(size),
	});
	return file;
};

const mockMetadata = { width: 800, height: 600, format: "jpeg" };

describe("addImage", () => {
	let mockFormData: FormData;

	test("should return success false on Unauthorized", async () => {
		(auth as Mock).mockResolvedValue(mockUnauthorizedSession);

		await expect(addImage(mockFormData)).rejects.toThrow("UNAUTHORIZED");
	});

	test("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

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

		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);

		// Mock ImagesDomainService
		const mockPrepareNewImages = vi.fn().mockResolvedValue({
			validatedImages: {
				path: "test-path",
				id: "generated-uuid",
				// other properties...
			},
			thumbnailBuffer: Buffer.from("thumbnail"),
			originalBuffer: Buffer.from("original"),
		});

		vi.mocked(ImagesDomainService).mockImplementation(
			() =>
				({
					prepareNewImages: mockPrepareNewImages,
				}) as any,
		);

		vi.mocked(sharp).mockReturnValue({
			metadata: vi.fn().mockResolvedValue(mockMetadata),
			resize: vi.fn().mockReturnThis(),
			toBuffer: vi
				.fn()
				.mockResolvedValueOnce(Buffer.from("original"))
				.mockResolvedValueOnce(Buffer.from("thumbnail")),
			// eslint-disable-next-line
		} as any);

		vi.mocked(imagesCommandRepository.create).mockResolvedValue();
		vi.mocked(imagesCommandRepository.uploadToStorage).mockResolvedValue();
		(uuidv7 as Mock).mockReturnValue("generated-uuid");

		const result = await addImage(mockFormData);

		expect(imagesCommandRepository.uploadToStorage).toHaveBeenCalledTimes(2);
		expect(imagesCommandRepository.create).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/(dumper)");
		expect(result).toEqual({
			success: true,
			message: `inserted`,
		});
	});

	test("should return success false on invalid file type", async () => {
		const validFileType = "invalid";
		const validFileSize = 1024 * 1024; // 1MB
		const file = createMockFile("myImage.jpeg", validFileType, validFileSize);
		mockFormData = new FormData();
		mockFormData.append("file", file);

		vi.clearAllMocks();
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(uuidv7 as Mock).mockReturnValue("generated-uuid");

		// Mock ImagesDomainService to throw validation error
		const mockPrepareNewImages = vi
			.fn()
			.mockRejectedValue(new FileNotAllowedError());
		vi.mocked(ImagesDomainService).mockImplementation(
			() =>
				({
					prepareNewImages: mockPrepareNewImages,
				}) as any,
		);

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "invalidFileFormat",
		});
	});

	test("should return success false on max file size", async () => {
		const validFileType = "image/jpeg";
		const validFileSize = 10_240 * 10_240 + 1; // 100MB over
		const file = createMockFile("myImage.jpeg", validFileType, validFileSize);
		mockFormData = new FormData();
		mockFormData.append("file", file);

		vi.clearAllMocks();
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(uuidv7 as Mock).mockReturnValue("generated-uuid");

		// Mock ImagesDomainService to throw validation error
		const mockPrepareNewImages = vi
			.fn()
			.mockRejectedValue(new FileNotAllowedError());
		vi.mocked(ImagesDomainService).mockImplementation(
			() =>
				({
					prepareNewImages: mockPrepareNewImages,
				}) as any,
		);

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "invalidFileFormat",
		});
	});

	test("should return success false on no file", async () => {
		mockFormData = new FormData();

		vi.clearAllMocks();
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(uuidv7 as Mock).mockReturnValue("generated-uuid");

		// Mock ImagesDomainService to throw validation error
		const mockPrepareNewImages = vi
			.fn()
			.mockRejectedValue(new UnexpectedError());
		vi.mocked(ImagesDomainService).mockImplementation(
			() =>
				({
					prepareNewImages: mockPrepareNewImages,
				}) as any,
		);

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});
});
