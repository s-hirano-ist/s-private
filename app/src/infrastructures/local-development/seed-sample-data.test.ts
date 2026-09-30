import { sharpImageProcessor } from "@/infrastructures/images/services/sharp-image-processor";
import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";
import prisma from "@/prisma";
import { Status } from "@s-hirano-ist/s-database";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/infrastructures/shared/storage/minio-storage-service", () => ({
	minioStorageService: { uploadImage: vi.fn(), deleteImage: vi.fn() },
}));

const { seedLocalDevelopmentSampleData } = await import("./seed-sample-data");

describe("seedLocalDevelopmentSampleData", () => {
	beforeEach(() => {
		vi.mocked(prisma.category.upsert).mockResolvedValue({
			id: "sample-category",
		} as never);
		vi.mocked(prisma.image.deleteMany).mockResolvedValue({ count: 0 });
	});

	test("creates unexported Dumper and exported Viewer fixtures for every domain", async () => {
		await seedLocalDevelopmentSampleData("local-user");

		expect(prisma.category.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { name_userId: { name: "Sample", userId: "local-user" } },
			}),
		);

		for (const repository of [
			prisma.article,
			prisma.note,
			prisma.book,
			prisma.image,
		]) {
			expect(repository.upsert).toHaveBeenCalledTimes(2);
			const statuses = vi
				.mocked(repository.upsert)
				.mock.calls.map(([args]) => args.create.status);
			expect(statuses).toEqual(
				expect.arrayContaining([Status.UNEXPORTED, Status.EXPORTED]),
			);
		}
		expect(
			vi.mocked(prisma.book.upsert).mock.calls.map(([args]) => args.where),
		).toEqual([
			{ id: "00000000-0000-7000-8000-000000000105" },
			{ id: "00000000-0000-7000-8000-000000000109" },
		]);

		expect(minioStorageService.uploadImage).toHaveBeenCalledTimes(4);
		expect(minioStorageService.uploadImage).toHaveBeenCalledWith(
			"sample-dumper-image-v2.png",
			expect.any(Buffer),
			false,
		);
		expect(minioStorageService.uploadImage).toHaveBeenCalledWith(
			"sample-viewer-image-v2.png",
			expect.any(Uint8Array),
			true,
		);

		const uploads = vi.mocked(minioStorageService.uploadImage).mock.calls;
		const original = uploads.find(([, , isThumbnail]) => !isThumbnail)?.[1];
		const thumbnail = uploads.find(([, , isThumbnail]) => isThumbnail)?.[1];
		expect(original).toBeDefined();
		expect(thumbnail).toBeDefined();
		expect(await sharpImageProcessor.getMetadata(original!)).toEqual({
			format: "png",
			width: 512,
			height: 512,
		});
		expect(await sharpImageProcessor.getMetadata(thumbnail!)).toEqual({
			format: "webp",
			width: 192,
			height: 192,
		});
		for (const [args] of vi.mocked(prisma.image.upsert).mock.calls) {
			expect(args.create).toEqual(
				expect.objectContaining({
					fileSize: original!.length,
					width: 512,
					height: 512,
				}),
			);
			expect(args.update).toEqual({
				fileSize: original!.length,
				width: 512,
				height: 512,
			});
		}
	});

	test("removes only the old local image records and objects", async () => {
		vi.mocked(prisma.image.deleteMany).mockResolvedValue({ count: 2 });

		await seedLocalDevelopmentSampleData("local-user");

		expect(prisma.image.deleteMany).toHaveBeenCalledWith({
			where: {
				userId: "local-user",
				path: {
					in: ["sample/dumper-image.png", "sample/viewer-image.png"],
				},
			},
		});
		expect(minioStorageService.deleteImage).toHaveBeenCalledTimes(4);
		expect(minioStorageService.deleteImage).toHaveBeenCalledWith(
			"sample/dumper-image.png",
			false,
		);
		expect(minioStorageService.deleteImage).toHaveBeenCalledWith(
			"sample/viewer-image.png",
			true,
		);
	});
});
