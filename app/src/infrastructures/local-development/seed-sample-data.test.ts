import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";
import prisma from "@/prisma";
import { Status } from "@s-hirano-ist/s-database";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/infrastructures/shared/storage/minio-storage-service", () => ({
	minioStorageService: { uploadImage: vi.fn() },
}));

const { seedLocalDevelopmentSampleData } = await import("./seed-sample-data");

describe("seedLocalDevelopmentSampleData", () => {
	beforeEach(() => {
		vi.mocked(prisma.category.upsert).mockResolvedValue({
			id: "sample-category",
		} as never);
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

		expect(minioStorageService.uploadImage).toHaveBeenCalledTimes(4);
		expect(minioStorageService.uploadImage).toHaveBeenCalledWith(
			"sample/dumper-image.png",
			expect.any(Buffer),
			false,
		);
		expect(minioStorageService.uploadImage).toHaveBeenCalledWith(
			"sample/viewer-image.png",
			expect.any(Uint8Array),
			true,
		);
	});
});
