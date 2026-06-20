import { getBooksImageFromStorage } from "@/application-services/books/get-books";
import { auth } from "@/infrastructures/auth/auth";
import { Readable } from "node:stream";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";

vi.mock("@/infrastructures/auth/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/application-services/books/get-books", () => ({
	getBooksImageFromStorage: vi.fn(),
}));

const { GET } = await import("./route");

const getSession = auth.api.getSession as unknown as Mock;

const authedRequest = {
	headers: new Headers(),
} as unknown as Parameters<typeof GET>[0];

describe("Books Images API Route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSession.mockResolvedValue({ session: {}, user: { id: "test-user" } });
	});

	test("should return WebP Content-Type for thumbnails", async () => {
		const mockStream = new Readable({ read() {} });
		vi.mocked(getBooksImageFromStorage).mockResolvedValue(mockStream);
		const params = Promise.resolve({
			contentType: "thumbnail",
			path: "cover.jpg",
		});

		const response = await GET(authedRequest, { params });

		expect(getBooksImageFromStorage).toHaveBeenCalledWith("cover.jpg", true);
		expect(response.headers.get("Content-Type")).toBe("image/webp");
	});

	test("should return path-derived Content-Type for originals", async () => {
		const mockStream = new Readable({ read() {} });
		vi.mocked(getBooksImageFromStorage).mockResolvedValue(mockStream);
		const params = Promise.resolve({
			contentType: "original",
			path: "cover.png",
		});

		const response = await GET(authedRequest, { params });

		expect(getBooksImageFromStorage).toHaveBeenCalledWith("cover.png", false);
		expect(response.headers.get("Content-Type")).toBe("image/png");
	});
});
