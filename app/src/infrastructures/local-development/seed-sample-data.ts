/**
 * Local-only sample content used immediately after the development account is
 * created. This deliberately bypasses application use cases: it is fixture
 * setup, not user-initiated content creation.
 */

import { tenantContext } from "@/common/tenant/tenant-context";
import { sharpImageProcessor } from "@/infrastructures/images/services/sharp-image-processor";
import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";
import prisma from "@/prisma";
import { Status } from "@s-hirano-ist/s-database";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const SAMPLE_CREATED_AT = new Date("2026-01-01T00:00:00.000Z");
const SAMPLE_CATEGORY_ID = "00000000-0000-7000-8000-000000000101";
const SAMPLE_IMAGE_PATH = existsSync(
	resolve("public/local-sample-landscape.png"),
)
	? resolve("public/local-sample-landscape.png")
	: resolve("app/public/local-sample-landscape.png");

const sampleContent = [
	{
		id: "00000000-0000-7000-8000-000000000102",
		path: "sample-dumper-image-v2.png",
		previousPath: "sample/dumper-image.png",
		status: Status.UNEXPORTED,
	},
	{
		id: "00000000-0000-7000-8000-000000000106",
		path: "sample-viewer-image-v2.png",
		previousPath: "sample/viewer-image.png",
		status: Status.EXPORTED,
	},
] as const;

/** Seeds a complete Dumper and Viewer fixture set for one local user. */
export async function seedLocalDevelopmentSampleData(
	userId: string,
): Promise<void> {
	await tenantContext.run({ userId }, async () => {
		const imageBytes = await readFile(SAMPLE_IMAGE_PATH);
		const [{ width, height }, thumbnailBytes] = await Promise.all([
			sharpImageProcessor.getMetadata(imageBytes),
			sharpImageProcessor.createThumbnail(imageBytes, 192, 192),
		]);

		await Promise.all(
			sampleContent.flatMap((image) => [
				minioStorageService.uploadImage(image.path, imageBytes, false),
				minioStorageService.uploadImage(image.path, thumbnailBytes, true),
			]),
		);

		const removedLegacyImages = await prisma.image.deleteMany({
			where: {
				userId,
				path: { in: sampleContent.map((image) => image.previousPath) },
			},
		});
		if (removedLegacyImages.count > 0) {
			await Promise.all(
				sampleContent.flatMap((image) => [
					minioStorageService.deleteImage(image.previousPath, false),
					minioStorageService.deleteImage(image.previousPath, true),
				]),
			);
		}

		const category = await prisma.category.upsert({
			where: { name_userId: { name: "Sample", userId } },
			update: {},
			create: {
				id: SAMPLE_CATEGORY_ID,
				name: "Sample",
				userId,
				createdAt: SAMPLE_CREATED_AT,
				updatedAt: SAMPLE_CREATED_AT,
			},
		});

		await Promise.all([
			prisma.article.upsert({
				where: {
					url_userId: { url: "https://example.com/sample-dumper", userId },
				},
				update: {},
				create: {
					id: "00000000-0000-7000-8000-000000000103",
					title: "Sample dumper article",
					url: "https://example.com/sample-dumper",
					quote: "A local sample waiting to be exported.",
					categoryId: category.id,
					status: Status.UNEXPORTED,
					userId,
					createdAt: SAMPLE_CREATED_AT,
					updatedAt: SAMPLE_CREATED_AT,
				},
			}),
			prisma.article.upsert({
				where: {
					url_userId: { url: "https://example.com/sample-viewer", userId },
				},
				update: {},
				create: {
					id: "00000000-0000-7000-8000-000000000107",
					title: "Sample viewer article",
					url: "https://example.com/sample-viewer",
					quote: "A local sample already available in Viewer.",
					categoryId: category.id,
					status: Status.EXPORTED,
					userId,
					createdAt: SAMPLE_CREATED_AT,
					updatedAt: SAMPLE_CREATED_AT,
					exportedAt: SAMPLE_CREATED_AT,
				},
			}),
			prisma.note.upsert({
				where: { title_userId: { title: "Sample dumper note", userId } },
				update: {},
				create: {
					id: "00000000-0000-7000-8000-000000000104",
					title: "Sample dumper note",
					markdown:
						"# Sample dumper note\n\nThis local note is ready to export.",
					status: Status.UNEXPORTED,
					userId,
					createdAt: SAMPLE_CREATED_AT,
					updatedAt: SAMPLE_CREATED_AT,
				},
			}),
			prisma.note.upsert({
				where: { title_userId: { title: "Sample viewer note", userId } },
				update: {},
				create: {
					id: "00000000-0000-7000-8000-000000000108",
					title: "Sample viewer note",
					markdown:
						"# Sample viewer note\n\nThis local note is already published.",
					status: Status.EXPORTED,
					userId,
					createdAt: SAMPLE_CREATED_AT,
					updatedAt: SAMPLE_CREATED_AT,
					exportedAt: SAMPLE_CREATED_AT,
				},
			}),
			prisma.book.upsert({
				where: { id: "00000000-0000-7000-8000-000000000105" },
				update: {},
				create: {
					id: "00000000-0000-7000-8000-000000000105",
					isbn: "9780000000101",
					title: "Sample dumper book",
					googleAuthors: ["Local Developer"],
					rating: 4,
					tags: ["sample"],
					markdown: "A local book waiting to be exported.",
					status: Status.UNEXPORTED,
					userId,
					createdAt: SAMPLE_CREATED_AT,
					updatedAt: SAMPLE_CREATED_AT,
				},
			}),
			prisma.book.upsert({
				where: { id: "00000000-0000-7000-8000-000000000109" },
				update: {},
				create: {
					id: "00000000-0000-7000-8000-000000000109",
					isbn: "9780000000102",
					title: "Sample viewer book",
					googleAuthors: ["Local Developer"],
					rating: 5,
					tags: ["sample"],
					markdown: "A local book already available in Viewer.",
					status: Status.EXPORTED,
					userId,
					createdAt: SAMPLE_CREATED_AT,
					updatedAt: SAMPLE_CREATED_AT,
					exportedAt: SAMPLE_CREATED_AT,
				},
			}),
			...sampleContent.map((image) =>
				prisma.image.upsert({
					where: { path_userId: { path: image.path, userId } },
					update: { fileSize: imageBytes.length, width, height },
					create: {
						id: image.id,
						path: image.path,
						contentType: "image/png",
						fileSize: imageBytes.length,
						width,
						height,
						status: image.status,
						userId,
						createdAt: SAMPLE_CREATED_AT,
						updatedAt: SAMPLE_CREATED_AT,
						...(image.status === Status.EXPORTED
							? { exportedAt: SAMPLE_CREATED_AT }
							: {}),
					},
				}),
			),
		]);
	});
}
