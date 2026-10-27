import {
	getExportedImages,
	getImagesCount,
	getUnexportedImages,
} from "@/application-services/images/get-images";
import { getBackendClient } from "@/common/backend/server-client";
import {
	createBackendClient,
	ApiProtocolError,
} from "@s-hirano-ist/s-api-client";
import { beforeEach, expect, test, vi } from "vite-plus/test";
vi.mock("@/common/backend/server-client", () => ({
	getBackendClient: vi.fn(),
}));
const image = {
	id: "image-id",
	path: "folder/photo.png",
	contentType: "image/png",
	fileSize: 5,
	width: 300,
	height: 200,
	status: "EXPORTED",
	createdAt: "2026-10-11T00:00:00Z",
	updatedAt: "2026-10-11T00:00:00Z",
	exportedAt: null,
};
beforeEach(() => vi.clearAllMocks());
function fixture(payload: unknown) {
	const fetch = vi
		.fn<typeof globalThis.fetch>()
		.mockResolvedValue(Response.json(payload));
	vi.mocked(getBackendClient).mockResolvedValue(
		createBackendClient({ baseURL: "https://backend.example/api/v1", fetch }),
	);
	return fetch;
}
function urlOf(input: RequestInfo | URL) {
	return new URL(input instanceof Request ? input.url : input);
}
test("uses owner-checked media IDs while preserving the image's accessible name and dimensions", async () => {
	const fetch = fixture({
		data: [image],
		totalCount: 1,
		offset: 24,
		limit: 24,
	});
	expect(await getExportedImages(24)).toEqual({
		data: [
			{
				id: image.id,
				alt: "Image folder/photo.png",
				originalPath: "/api/v1/media/images/image-id/original",
				thumbnailPath: "/api/v1/media/images/image-id/thumbnail",
				width: 300,
				height: 200,
			},
		],
		totalCount: 1,
	});
	expect(
		Object.fromEntries(urlOf(fetch.mock.calls[0][0]).searchParams),
	).toEqual({ status: "EXPORTED", offset: "24", limit: "24" });
	expect(fetch.mock.calls[0][1]?.cache).toBe("no-store");
});
test("fetches updated image pages and typed counts", async () => {
	const fetch = fixture({ data: [], totalCount: 0, offset: 0, limit: 24 });
	expect((await getUnexportedImages(0)).totalCount).toBe(0);
	fetch.mockResolvedValue(
		Response.json({ data: [image], totalCount: 1, offset: 0, limit: 24 }),
	);
	expect((await getUnexportedImages(0)).totalCount).toBe(1);
	fetch.mockResolvedValue(Response.json({ count: 7 }));
	expect(await getImagesCount("EXPORTED")).toBe(7);
});
test("rejects invalid persisted dimensions before rendering", async () => {
	fixture({
		data: [{ ...image, width: -1 }],
		totalCount: 1,
		offset: 0,
		limit: 24,
	});
	await expect(getExportedImages(0)).rejects.toBeInstanceOf(ApiProtocolError);
});
