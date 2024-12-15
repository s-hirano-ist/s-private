import { SUCCESS_MESSAGES } from "@/constants";
import { env } from "@/env.mjs";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getUserId,
	hasSelfPostPermissionOrThrow,
} from "@/features/auth/utils/get-session";
import { minioClient } from "@/minio";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { formatCreateImageMessage } from "@/utils/format-for-line";
import { revalidatePath } from "next/cache";
import { v7 as uuidv7 } from "uuid";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { addImage } from "./add-image";

vi.mock("@/features/auth/utils/get-session", () => ({
	hasSelfPostPermissionOrThrow: vi.fn(),
	getUserId: vi.fn(),
}));

vi.mock("uuid", () => ({
	v7: vi.fn(),
}));

vi.mock("@/minio", () => ({
	minioClient: {
		putObject: vi.fn(),
	},
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/prisma", () => ({
	__esModule: true,
	default: {
		images: {
			create: vi.fn(),
		},
	},
}));

vi.mock("@/utils/format-for-line", () => ({
	formatCreateImageMessage: vi.fn(),
}));

vi.mock("@/utils/fetch-message", () => ({
	sendLineNotifyMessage: vi.fn(),
}));

vi.mock("@/error-wrapper", () => ({
	wrapServerSideErrorForClient: vi.fn(),
}));

describe("addImage", () => {
	const bucketName = env.MINIO_BUCKET_NAME;
	const validFileType = "image/jpeg";
	const validFileSize = 1024 * 1024; // 1MB
	let formData: FormData;

	beforeEach(() => {
		(hasSelfPostPermissionOrThrow as Mock).mockResolvedValue(true);
		(getUserId as Mock).mockResolvedValue("userId");
		(uuidv7 as Mock).mockReturnValue("generated-uuid");
		(prisma.images.create as Mock).mockResolvedValue({
			id: "generated-uuid-myimage.jpeg",
		});
		(formatCreateImageMessage as Mock).mockReturnValue("message");
		formData = new FormData();
	});

	const createMockFile = (name: string, type: string, size: number): File => {
		const file = new File([new Uint8Array([0x00])], name, {
			type,
		});
		Object.defineProperty(file, "size", { value: size });
		// arrayBufferをモック
		Object.defineProperty(file, "arrayBuffer", {
			value: async () => new ArrayBuffer(size),
		});
		return file;
	};

	it("should return success when everything is correct", async () => {
		const file = createMockFile("myimage.jpeg", validFileType, validFileSize);
		formData.append("file", file);

		const result = await addImage(formData);
		expect(hasSelfPostPermissionOrThrow).toHaveBeenCalled();
		expect(getUserId).toHaveBeenCalled();
		expect(minioClient.putObject).toHaveBeenCalledWith(
			bucketName,
			expect.stringMatching(/^generated-uuid-myimage\.jpeg$/),
			expect.any(Buffer),
		);
		expect(prisma.images.create).toHaveBeenCalledWith({
			data: { id: "generated-uuid-myimage.jpeg", userId: "userId" },
			select: { id: true },
		});
		expect(loggerInfo).toHaveBeenCalledWith("message", {
			caller: "addImage",
			status: 200,
		});
		expect(sendLineNotifyMessage).toHaveBeenCalledWith("message");
		expect(revalidatePath).toHaveBeenCalledWith("/dumper");
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.INSERTED,
			data: undefined,
		});
	});

	it("should throw UnexpectedError if file is not provided", async () => {
		(wrapServerSideErrorForClient as Mock).mockImplementation(
			async (err: Error) => {
				return { success: false, message: err.message };
			},
		);

		const result = await addImage(formData); // no file appended
		expect(result).toEqual({
			success: false,
			message: "予期せぬエラーが発生しました。",
		});
	});

	it("should throw FileNotAllowedError if file type is not allowed", async () => {
		const file = createMockFile("myimage.bmp", "image/bmp", validFileSize);
		formData.append("file", file);

		(wrapServerSideErrorForClient as Mock).mockImplementation(
			async (err: Error) => {
				return { success: false, message: err.message };
			},
		);

		const result = await addImage(formData);
		expect(result).toEqual({
			success: false,
			message: "ファイルのフォーマットが無効です。",
		});
	});

	it("should throw FileNotAllowedError if file size is too large", async () => {
		const file = createMockFile(
			"myimage.jpeg",
			validFileType,
			101 * 1024 * 1024,
		); // 101MB
		formData.append("file", file);

		(wrapServerSideErrorForClient as Mock).mockImplementation(
			async (err: Error) => {
				return { success: false, message: err.message };
			},
		);

		const result = await addImage(formData);
		expect(result).toEqual({
			success: false,
			message: "ファイルのフォーマットが無効です。",
		});
	});

	it("should handle errors from hasSelfPostPermissionOrThrow", async () => {
		(hasSelfPostPermissionOrThrow as Mock).mockRejectedValue(
			new Error("permission error"),
		);
		(wrapServerSideErrorForClient as Mock).mockImplementation(
			async (err: Error) => {
				return { success: false, message: err.message };
			},
		);

		const file = createMockFile("myimage.jpeg", validFileType, validFileSize);
		formData.append("file", file);

		const result = await addImage(formData);
		expect(result).toEqual({
			success: false,
			message: "permission error",
		});
	});

	it("should handle errors from prisma", async () => {
		(prisma.images.create as Mock).mockRejectedValue(new Error("db error"));
		(wrapServerSideErrorForClient as Mock).mockImplementation(
			async (err: Error) => {
				return { success: false, message: err.message };
			},
		);

		const file = createMockFile("myimage.jpeg", validFileType, validFileSize);
		formData.append("file", file);

		const result = await addImage(formData);

		expect(result).toEqual({
			success: false,
			message: "db error",
		});
	});

	it("should handle errors from minioClient", async () => {
		(minioClient.putObject as Mock).mockRejectedValue(new Error("minio error"));
		(wrapServerSideErrorForClient as Mock).mockImplementation(
			async (err: Error) => {
				return { success: false, message: err.message };
			},
		);

		const file = createMockFile("myimage.jpeg", validFileType, validFileSize);
		formData.append("file", file);

		const result = await addImage(formData);
		expect(result).toEqual({
			success: false,
			message: "minio error",
		});
	});
});
