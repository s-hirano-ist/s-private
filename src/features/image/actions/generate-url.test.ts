import { env } from "@/env";
import { auth } from "@/features/auth/utils/auth";
import { minioClient } from "@/minio";
import { Session } from "next-auth";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { generateUrl } from "./generate-url";

vi.mock("@/features/auth/utils/auth", () => ({ auth: vi.fn() }));

vi.mock("@/utils/fetch-message", () => ({
	sendPushoverMessage: vi.fn(),
}));

vi.mock("@/minio", () => ({
	minioClient: { presignedGetObject: vi.fn() },
}));

describe("generateUrl", () => {
	const mockFetch = vi.fn();

	const fileName = "test-image.jpg";
	const mockUrl = "http://example.com/test-image.jpg";

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

		const result = await generateUrl(mockFileName);

		expect(result).toEqual({
			success: false,
			message: "unauthorized",
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	it("should return success false on not permitted", async () => {
		(auth as Mock).mockResolvedValue(mockNotAllowedRoleSession);

		const result = await generateUrl(mockFileName);

		expect(result).toEqual({
			success: false,
			message: "notAllowed",
		});
		expect(auth).toHaveBeenCalledTimes(1);
	});

	it("should return a presigned URL and metadata when inputs are valid", async () => {
		(auth as Mock).mockResolvedValue(mockAllowedRoleSession);

		vi.mocked(minioClient.presignedGetObject).mockResolvedValue(mockUrl);
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
			// eslint-disable-next-line
		} as any);

		const result = await generateUrl(fileName);

		expect(minioClient.presignedGetObject).toHaveBeenCalledWith(
			env.MINIO_BUCKET_NAME,
			`images/thumbnail/${fileName}`,
			24 * 60 * 60,
		);
		expect(minioClient.presignedGetObject).toHaveBeenCalledTimes(2);
		expect(result).toEqual({
			success: true,
			message: "success",
			data: {
				thumbnailSrc: mockUrl,
				originalSrc: mockUrl,
			},
		});
	});
});
