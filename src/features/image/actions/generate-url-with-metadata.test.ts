import { SUCCESS_MESSAGES } from "@/constants";
import { env } from "@/env.mjs";
import { hasSelfPostPermissionOrThrow } from "@/features/auth/utils/get-session";
import { minioClient } from "@/minio";
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateUrlWithMetadata } from "./generate-url-with-metadata";

vi.mock("@/minio", () => ({
	minioClient: { presignedGetObject: vi.fn() },
}));

vi.mock("@/features/auth/utils/get-session", () => ({
	hasSelfPostPermissionOrThrow: vi.fn(),
}));

vi.mock("sharp", () => ({
	__esModule: true,
	default: vi.fn(() => ({
		metadata: vi.fn(),
	})),
}));

describe("generateUrlWithMetadata", () => {
	const mockFetch = vi.fn();

	const fileName = "test-image.jpg";
	const mockUrl = "http://example.com/test-image.jpg";
	const mockMetadata = { width: 800, height: 600, format: "jpeg" };

	beforeEach(() => {
		global.fetch = mockFetch;
	});

	it("should return a presigned URL and metadata when inputs are valid", async () => {
		// モックの設定
		vi.mocked(hasSelfPostPermissionOrThrow).mockResolvedValue();
		vi.mocked(minioClient.presignedGetObject).mockResolvedValue(mockUrl);
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
			// biome-ignore lint: for test
		} as any);
		vi.mocked(sharp).mockReturnValue({
			metadata: vi.fn().mockResolvedValue(mockMetadata),
			// biome-ignore lint: for test
		} as any);

		// 実行
		const result = await generateUrlWithMetadata(fileName);

		// 検証
		expect(hasSelfPostPermissionOrThrow).toHaveBeenCalled();
		expect(minioClient.presignedGetObject).toHaveBeenCalledWith(
			env.MINIO_BUCKET_NAME,
			fileName,
			24 * 60 * 60,
		);
		expect(fetch).toHaveBeenCalledWith(mockUrl);
		expect(sharp).toHaveBeenCalled();
		expect(result).toEqual({
			success: true,
			message: SUCCESS_MESSAGES.INSERTED,
			data: {
				url: mockUrl,
				metadata: mockMetadata,
			},
		});
	});

	it("should throw an error if the presigned URL fetch fails", async () => {
		// モックの設定
		vi.mocked(hasSelfPostPermissionOrThrow).mockResolvedValue();
		vi.mocked(minioClient.presignedGetObject).mockResolvedValue(mockUrl);
		// biome-ignore lint: for test
		vi.mocked(fetch).mockResolvedValue({ ok: false } as any);

		// 実行
		const result = await generateUrlWithMetadata(fileName);

		// 検証
		expect(result.success).toBe(false);
		expect(result.message).toBeDefined(); // wrapServerSideErrorForClient のエラー
	});

	it("should throw an error if metadata extraction fails", async () => {
		// モックの設定
		vi.mocked(hasSelfPostPermissionOrThrow).mockResolvedValue();
		vi.mocked(minioClient.presignedGetObject).mockResolvedValue(mockUrl);
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
			// biome-ignore lint: for test
		} as any);
		vi.mocked(sharp).mockImplementation(() => {
			throw new Error("Sharp error");
		});

		// 実行
		const result = await generateUrlWithMetadata(fileName);

		// 検証
		expect(result.success).toBe(false);
		expect(result.message).toBeDefined(); // wrapServerSideErrorForClient のエラー
	});

	it("should throw an error if permission check fails", async () => {
		// モックの設定
		vi.mocked(hasSelfPostPermissionOrThrow).mockRejectedValue(
			new Error("Permission denied"),
		);

		// 実行
		const result = await generateUrlWithMetadata(fileName);

		// 検証
		expect(result.success).toBe(false);
		expect(result.message).toBeDefined(); // wrapServerSideErrorForClient のエラー
	});
});
