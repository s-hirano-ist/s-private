import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants";
import { env } from "@/env.mjs";
import { auth } from "@/features/auth/utils/auth";
import { hasDumperPostPermission } from "@/features/auth/utils/role";
import { minioClient } from "@/minio";
import { Session } from "next-auth";
import sharp from "sharp";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { generateUrlWithMetadata } from "./generate-url-with-metadata";

vi.mock("@/features/auth/utils/auth", () => ({ auth: vi.fn() }));

vi.mock("@/minio", () => ({
	minioClient: { presignedGetObject: vi.fn() },
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

	const mockAllowedRoleSession: Session = {
		user: { id: "1", roles: ["dumper"] },
		expires: "2025-01-01",
	};
	const mockNotAllowedRoleSession: Session = {
		user: { id: "1", roles: [] },
		expires: "2025-01-01",
	};
	const mockUnauthorizedSession = null;

	const mockFileName = "sampleFileName";

	beforeEach(() => {
		global.fetch = mockFetch;
	});

	it("should return success false on Unauthorized", async () => {
		(auth as Mock).mockResolvedValue(mockUnauthorizedSession);

		const result = await generateUrlWithMetadata(mockFileName);

		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.UNAUTHORIZED,
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	it("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

		const result = await generateUrlWithMetadata(mockFileName);

		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.NOT_ALLOWED,
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	it("should return a presigned URL and metadata when inputs are valid", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);

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

		const result = await generateUrlWithMetadata(fileName);

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
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);

		vi.mocked(minioClient.presignedGetObject).mockResolvedValue(mockUrl);
		vi.mocked(fetch).mockResolvedValue({
			ok: false, // biome-ignore lint: for test
		} as any);

		const result = await generateUrlWithMetadata(fileName);

		expect(result).toEqual({
			success: false,
			message: ERROR_MESSAGES.UNEXPECTED,
		});
	});
});
