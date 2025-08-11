import { revalidatePath } from "next/cache";
import { Session } from "next-auth";
import sharp, { Sharp } from "sharp";
import { v7 as uuidv7 } from "uuid";
import { describe, expect, Mock, test, vi } from "vitest";
import { imageRepository } from "@/features/image/repositories/image-repository";
import { auth } from "@/utils/auth/auth";
import { addImage } from "./add-image";

vi.mock("@/utils/notification/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
}));

vi.mock("uuid", () => ({ v7: vi.fn() }));

vi.mock("@/features/image/repositories/image-repository", () => ({
	imageRepository: {
		create: vi.fn(),
		uploadToStorage: vi.fn(),
		invalidateCache: vi.fn(),
	},
}));

type PartialSharp = Pick<Sharp, "metadata" | "resize" | "toBuffer">;
vi.mock("sharp", () => {
	return {
		__esModule: true,
		default: vi.fn(() => {
			const mockSharp: PartialSharp = {
				metadata: vi.fn().mockResolvedValue({
					width: 800,
					height: 600,
				}),
				resize: vi.fn().mockReturnThis(),
				toBuffer: vi.fn().mockResolvedValue(Buffer.from("thumbnail")),
			};
			return mockSharp;
		}),
	};
});

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
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);

		vi.mocked(sharp).mockReturnValue({
			metadata: vi.fn().mockResolvedValue(mockMetadata),
			resize: vi.fn().mockReturnThis(),
			toBuffer: vi.fn().mockResolvedValueOnce(Buffer.from("thumbnail")),
			// eslint-disable-next-line
		} as any);

		vi.mocked(imageRepository.create).mockResolvedValue({
			id: "generated-uuid-myImage.jpeg",
			userId: "1",
			contentType: "image/jpeg",
			fileSize: null,
			width: null,
			height: null,
			tags: [],
			description: null,
			status: "UNEXPORTED",
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
		});
		(uuidv7 as Mock).mockReturnValue("generated-uuid");

		const result = await addImage(mockFormData);

		expect(imageRepository.uploadToStorage).toHaveBeenCalledTimes(2);
		expect(imageRepository.create).toHaveBeenCalled();
		expect(imageRepository.invalidateCache).toHaveBeenCalled();
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
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(uuidv7 as Mock).mockReturnValue("generated-uuid");

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
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(uuidv7 as Mock).mockReturnValue("generated-uuid");

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "invalidFileFormat",
		});
	});

	test("should return success false on no file", async () => {
		mockFormData = new FormData();
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);
		(uuidv7 as Mock).mockReturnValue("generated-uuid");

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});
});
