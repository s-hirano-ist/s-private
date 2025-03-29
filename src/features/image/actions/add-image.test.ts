import { auth } from "@/features/auth/utils/auth";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
import { Session } from "next-auth";
import { revalidatePath } from "next/cache";
import sharp, { Sharp } from "sharp";
import { v7 as uuidv7 } from "uuid";
import { Mock, describe, expect, test, vi } from "vitest";
import { addImage } from "./add-image";

vi.mock("@/features/auth/utils/auth", () => ({ auth: vi.fn() }));

vi.mock("@/utils/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
}));

vi.mock("uuid", () => ({ v7: vi.fn() }));

vi.mock("@/minio", () => ({ minioClient: { putObject: vi.fn() } }));

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

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "unauthorized",
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	test("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "notAllowed",
		});
		expect(auth).toHaveBeenCalledTimes(1);
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

		(prisma.images.create as Mock).mockResolvedValue({
			id: "generated-uuid-myImage.jpeg",
		});
		(uuidv7 as Mock).mockReturnValue("generated-uuid");

		const result = await addImage(mockFormData);

		expect(minioClient.putObject).toHaveBeenCalledTimes(2);
		expect(prisma.images.create).toHaveBeenCalled();
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
		(prisma.images.create as Mock).mockResolvedValue({
			id: "generated-uuid-myImage.jpeg",
		});
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
		(prisma.images.create as Mock).mockResolvedValue({
			id: "generated-uuid-myImage.jpeg",
		});
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
		(prisma.images.create as Mock).mockResolvedValue({
			id: "generated-uuid-myImage.jpeg",
		});
		(uuidv7 as Mock).mockReturnValue("generated-uuid");

		const result = await addImage(mockFormData);

		expect(result).toEqual({
			success: false,
			message: "unexpected",
		});
	});
});
