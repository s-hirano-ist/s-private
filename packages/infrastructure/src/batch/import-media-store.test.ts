import { createImportMediaStore } from "@s-hirano-ist/s-infrastructure/batch/import-media-store";
import { StorageOperationError } from "@s-hirano-ist/s-storage";
import { expect, test, vi } from "vite-plus/test";

function fixture() {
	const storage = {
		getImageOrThrow: vi
			.fn<(path: string, thumbnail: boolean) => Promise<void>>()
			.mockResolvedValue(undefined),
		getImage: vi.fn(),
		uploadImage: vi
			.fn<
				(path: string, bytes: Uint8Array, thumbnail: boolean) => Promise<void>
			>()
			.mockResolvedValue(undefined),
		deleteImage: vi
			.fn<(path: string, thumbnail: boolean) => Promise<void>>()
			.mockResolvedValue(undefined),
	};
	const processor = {
		getMetadata: vi.fn().mockResolvedValue({}),
		createThumbnail: vi.fn().mockResolvedValue(Buffer.from("thumbnail")),
	};
	return {
		storage,
		media: createImportMediaStore(
			{ images: storage, books: storage },
			processor,
		),
	};
}
test("existing originals are preserved while thumbnails are refreshed", async () => {
	const { storage, media } = fixture();
	await media.put("images", "a.png", Buffer.from("original"));
	expect(storage.uploadImage).toHaveBeenCalledExactlyOnceWith(
		"a.png",
		Buffer.from("thumbnail"),
		true,
	);
});
test("missing originals are uploaded through the new import adapter", async () => {
	const { storage, media } = fixture();
	storage.getImageOrThrow.mockRejectedValue(
		new StorageOperationError(
			{
				operation: "getImageOrThrow",
				bucketName: "test",
				objectKey: "books/original/a.png",
			},
			{ name: "NotFound", $metadata: { httpStatusCode: 404 } },
		),
	);
	await media.put("books", "a.png", Buffer.from("original"));
	expect(storage.uploadImage).toHaveBeenCalledWith(
		"a.png",
		Buffer.from("original"),
		false,
	);
	expect(storage.uploadImage).toHaveBeenCalledWith(
		"a.png",
		Buffer.from("thumbnail"),
		true,
	);
});
test.each([
	new Error("network failure"),
	{ name: "AccessDenied", $metadata: { httpStatusCode: 403 } },
])("failed existence checks do not cause writes: %s", async (error) => {
	const { storage, media } = fixture();
	storage.getImageOrThrow.mockRejectedValue(error);
	await expect(
		media.put("images", "a.png", Buffer.from("original")),
	).rejects.toBe(error);
	expect(storage.uploadImage).not.toHaveBeenCalled();
});
