import { Readable } from "node:stream";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/infrastructures/auth/auth-provider", () => ({
	auth: vi.fn((handler) => handler),
}));

vi.mock("@/application-services/images/get-images", () => ({
	getImagesFromStorage: vi.fn(),
}));

const { GET } = await import("./route");
const { getImagesFromStorage } = await import(
	"@/application-services/images/get-images"
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
		const request = { auth: null } as unknown as Parameters<typeof GET>[0];
		const params = Promise.resolve({
			contentType: "thumbnail",
			id: "image-123",
		});

		const response = (await GET(request, { params })) as Response;
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBe("Unauthorized");
		expect(getImagesFromStorage).not.toHaveBeenCalled();
	});

	test("should call forbidden when user doesn't have viewer role", async () => {
		const request = {
			auth: { user: { roles: ["dumper"] } },
		} as unknown as Parameters<typeof GET>[0];
		const params = Promise.resolve({
			contentType: "thumbnail",
			id: "image-123",
		});

		await expect(GET(request, { params })).rejects.toThrow("FORBIDDEN");
	});

	test("should return image stream for thumbnail when user has viewer role", async () => {
		const mockStream = new Readable({ read() {} });
		vi.mocked(getImagesFromStorage).mockResolvedValue(mockStream);

		const request = {
			auth: { user: { roles: ["viewer"] } },
		} as unknown as Parameters<typeof GET>[0];
		const params = Promise.resolve({
			contentType: "thumbnail",
			id: "image-123",
		});

		const response = (await GET(request, { params })) as Response;

		expect(getImagesFromStorage).toHaveBeenCalledWith("image-123", true);
		expect(response.headers.get("Content-Type")).toBe("image/jpeg");
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=31536000, immutable",
		);
	});

	test("should return image stream for full image when contentType is not thumbnail", async () => {
		const mockStream = new Readable({ read() {} });
		vi.mocked(getImagesFromStorage).mockResolvedValue(mockStream);

		const request = {
			auth: { user: { roles: ["viewer"] } },
		} as unknown as Parameters<typeof GET>[0];
		const params = Promise.resolve({ contentType: "full", id: "image-123" });

		const response = (await GET(request, { params })) as Response;

		expect(getImagesFromStorage).toHaveBeenCalledWith("image-123", false);
		expect(response.headers.get("Content-Type")).toBe("image/jpeg");
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=31536000, immutable",
		);
	});

	test("should handle user with multiple roles including viewer", async () => {
		const mockStream = new Readable({ read() {} });
		vi.mocked(getImagesFromStorage).mockResolvedValue(mockStream);

		const request = {
			auth: { user: { roles: ["dumper", "viewer"] } },
		} as unknown as Parameters<typeof GET>[0];
		const params = Promise.resolve({
			contentType: "thumbnail",
			id: "image-123",
		});

		const response = (await GET(request, { params })) as Response;

		expect(getImagesFromStorage).toHaveBeenCalledWith("image-123", true);
		expect(response.status).toBe(200);
	});
});
