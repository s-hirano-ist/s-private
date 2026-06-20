import { auth } from "@/infrastructures/auth/auth";
import { Readable } from "node:stream";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";

vi.mock("@/infrastructures/auth/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/application-services/images/get-images", () => ({
	getImagesFromStorage: vi.fn(),
}));

const { GET } = await import("./route");
const { getImagesFromStorage } =
	await import("@/application-services/images/get-images");

const getSession = auth.api.getSession as unknown as Mock;

const authedRequest = {
	headers: new Headers(),
} as unknown as Parameters<typeof GET>[0];

describe("Images API Route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSession.mockResolvedValue({ session: {}, user: { id: "test-user" } });
	});

	test("should return 401 when user is not authenticated", async () => {
		// Make sure getImagesFromStorage is not called for unauthenticated requests
		vi.mocked(getImagesFromStorage).mockRejectedValue(
			new Error("Should not be called"),
		);
		getSession.mockResolvedValue(null);
		const request = {
			headers: new Headers(),
		} as unknown as Parameters<typeof GET>[0];
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
	test("should return image stream for thumbnail when authenticated", async () => {
		const mockStream = new Readable({ read() {} });
		vi.mocked(getImagesFromStorage).mockResolvedValue(mockStream);

		const params = Promise.resolve({
			contentType: "thumbnail",
			id: "image-123",
		});

		const response = await GET(authedRequest, { params });

		expect(getImagesFromStorage).toHaveBeenCalledWith("image-123", true);
		expect(response.headers.get("Content-Type")).toBe("image/webp");
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=31536000, immutable",
		);
	});

	test("should return image stream for full image when contentType is not thumbnail", async () => {
		const mockStream = new Readable({ read() {} });
		vi.mocked(getImagesFromStorage).mockResolvedValue(mockStream);

		const params = Promise.resolve({ contentType: "full", id: "image-123" });

		const response = await GET(authedRequest, { params });

		expect(getImagesFromStorage).toHaveBeenCalledWith("image-123", false);
		expect(response.headers.get("Content-Type")).toBe("image/jpeg");
		expect(response.headers.get("Cache-Control")).toBe(
			"public, max-age=31536000, immutable",
		);
	});

	test("should return WebP Content-Type for thumbnails regardless of path", async () => {
		const mockStream = new Readable({ read() {} });
		vi.mocked(getImagesFromStorage).mockResolvedValue(mockStream);

		const params = Promise.resolve({
			contentType: "thumbnail",
			id: "image-123.webp",
		});

		const response = await GET(authedRequest, { params });

		expect(getImagesFromStorage).toHaveBeenCalledWith("image-123.webp", true);
		expect(response.headers.get("Content-Type")).toBe("image/webp");
	});

	test("should return correct Content-Type for png images", async () => {
		const mockStream = new Readable({ read() {} });
		vi.mocked(getImagesFromStorage).mockResolvedValue(mockStream);

		const params = Promise.resolve({
			contentType: "original",
			id: "image-123.png",
		});

		const response = await GET(authedRequest, { params });

		expect(getImagesFromStorage).toHaveBeenCalledWith("image-123.png", false);
		expect(response.headers.get("Content-Type")).toBe("image/png");
	});
});
