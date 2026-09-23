import { beforeEach, describe, expect, test, vi } from "vitest";

const uploadFindMany = vi.hoisted(() => vi.fn());
const uploadFindFirst = vi.hoisted(() => vi.fn());
const uploadCreate = vi.hoisted(() => vi.fn());
const uploadUpdate = vi.hoisted(() => vi.fn());
const uploadDelete = vi.hoisted(() => vi.fn());
const putObject = vi.hoisted(() => vi.fn());
const removeObject = vi.hoisted(() => vi.fn());
vi.mock("@/prisma", () => ({
	default: {
		mobileUpload: {
			findMany: uploadFindMany,
			findFirst: uploadFindFirst,
			create: uploadCreate,
			update: uploadUpdate,
			delete: uploadDelete,
		},
	},
}));
vi.mock("@/minio", () => ({ minioClient: { putObject, removeObject } }));

import {
	MOBILE_CHUNK_SIZE,
	MOBILE_UPLOAD_LIMIT,
	getMobileUpload,
	putMobileChunk,
	startMobileUpload,
} from "./uploads";

describe("mobile chunk uploads", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		uploadFindMany.mockResolvedValue([]);
	});

	test("rejects files over ten MiB", async () => {
		await expect(
			startMobileUpload("owner-1", {
				operationId: crypto.randomUUID(),
				domain: "images",
				contentType: "image/jpeg",
				fileSize: MOBILE_UPLOAD_LIMIT + 1,
				metadata: {},
			}),
		).rejects.toThrow("Too big");
	});

	test("does not reveal another owner's upload", async () => {
		uploadFindFirst.mockResolvedValue(null);
		await expect(getMobileUpload("owner-1", "foreign")).rejects.toMatchObject({
			code: "NOT_FOUND",
			status: 404,
		});
		expect(uploadFindFirst).toHaveBeenCalledWith({
			where: { id: "foreign", userId: "owner-1" },
		});
	});

	test("accepts an exact one MiB part and records it once", async () => {
		uploadFindFirst.mockResolvedValue({
			id: "upload-1",
			userId: "owner-1",
			fileSize: MOBILE_CHUNK_SIZE * 2,
			receivedParts: [],
			expiresAt: new Date(Date.now() + 60_000),
		});
		await expect(
			putMobileChunk(
				"owner-1",
				"upload-1",
				0,
				new Uint8Array(MOBILE_CHUNK_SIZE),
			),
		).resolves.toEqual({ accepted: true, part: 0 });
		expect(putObject).toHaveBeenCalledOnce();
		expect(uploadUpdate).toHaveBeenCalledWith({
			where: { id: "upload-1" },
			data: { receivedParts: [0] },
		});
	});
});
