import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";

// Mock dependencies
vi.mock("next/navigation", () => ({
	forbidden: vi.fn().mockImplementation(() => {
		throw new Error("Forbidden");
	}),
}));

vi.mock("@/features/images/actions/get-images", () => ({
	getImagesFromStorage: vi.fn(),
}));

const { getImagesFromStorage } = await import(
	"@/applications/images/get-images"
);

describe("Images API Route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return 401 when user is not authenticated", async () => {
		// Make sure getImagesFromStorage is not called for unauthenticated requests
		vi.mocked(getImagesFromStorage).mockRejectedValue(
			new Error("Should not be called"),
		);

		const request = {
			auth: null,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any;
		const params = Promise.resolve({
			contentType: "thumbnail",
			id: "image-123",
		});

		const response = await GET(request, { params });
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBe("Unauthorized");
		expect(getImagesFromStorage).not.toHaveBeenCalled();
	});

	test("should call forbidden when user doesn't have viewer role", async () => {
		const request = {
			auth: {
				user: {
					roles: ["dumper"],
				},
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any;
		const params = Promise.resolve({
			contentType: "thumbnail",
			id: "image-123",
		});

		await expect(GET(request, { params })).rejects.toThrow("Forbidden");
	});

	test("should return image stream for thumbnail when user has viewer role", async () => {
		const mockStream = new ReadableStream();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(getImagesFromStorage).mockResolvedValue(mockStream as any);

		const request = {
			auth: {
				user: {
					roles: ["viewer"],
				},
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any;
		const params = Promise.resolve({
			contentType: "thumbnail",
			id: "image-123",
		});

		const response = await GET(request, { params });

		expect(getImagesFromStorage).toHaveBeenCalledWith("image-123", true);
		expect(response.headers.get("Content-Type")).toBe("image/jpeg");
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=31536000, immutable",
		);
	});

	test("should return image stream for full image when contentType is not thumbnail", async () => {
		const mockStream = new ReadableStream();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(getImagesFromStorage).mockResolvedValue(mockStream as any);

		const request = {
			auth: {
				user: {
					roles: ["viewer"],
				},
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any;
		const params = Promise.resolve({ contentType: "full", id: "image-123" });

		const response = await GET(request, { params });

		expect(getImagesFromStorage).toHaveBeenCalledWith("image-123", false);
		expect(response.headers.get("Content-Type")).toBe("image/jpeg");
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=31536000, immutable",
		);
	});

	test("should handle user with multiple roles including viewer", async () => {
		const mockStream = new ReadableStream();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(getImagesFromStorage).mockResolvedValue(mockStream as any);

		const request = {
			auth: {
				user: {
					roles: ["dumper", "viewer"],
				},
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any;
		const params = Promise.resolve({
			contentType: "thumbnail",
			id: "image-123",
		});

		const response = await GET(request, { params });

		expect(getImagesFromStorage).toHaveBeenCalledWith("image-123", true);
		expect(response.status).toBe(200);
	});
});
