import type { PreparedImport } from "@s-hirano-ist/s-application/batch/import-models";
import type { MobileDomain } from "@s-hirano-ist/s-application/content/models";
import { synchronizeContent } from "@s-hirano-ist/s-application/batch/synchronize-content";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { createContentImportRepository } from "@s-hirano-ist/s-infrastructure/batch/content-import-repository";
import { createImportMediaStore } from "@s-hirano-ist/s-infrastructure/batch/import-media-store";
import { sharpImageProcessor } from "@s-hirano-ist/s-infrastructure/content/sharp-image-processor";
import { createBooksStorageService } from "@s-hirano-ist/s-infrastructure/shared/books-storage-service";
import { createImagesStorageService } from "@s-hirano-ist/s-infrastructure/shared/minio-storage-service";
import { systemClock } from "@s-hirano-ist/s-infrastructure/system-clock";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { createMinioClient } from "@s-hirano-ist/s-storage";

/** CLI composition root: arguments, environment, progress and process result. */
export async function runContentImport(
	domain: MobileDomain,
	source: (root: string) => AsyncIterable<PreparedImport>,
) {
	const databaseUrl = process.env.DATABASE_URL;
	const owner = process.env.USERNAME_TO_EXPORT;
	if (!databaseUrl || !owner)
		throw new Error("DATABASE_URL and USERNAME_TO_EXPORT are required.");
	const dryRun = process.argv.includes("--dry-run");
	const prisma = createPrismaClient(databaseUrl);
	const notification = createPushoverService({
		url: process.env.PUSHOVER_URL ?? "",
		userKey: process.env.PUSHOVER_USER_KEY ?? "",
		appToken: process.env.PUSHOVER_APP_TOKEN ?? "",
	});
	try {
		const mediaDomain = domain === "images" || domain === "books";
		const bucket = process.env.MINIO_BUCKET_NAME;
		if (mediaDomain && !dryRun && !bucket)
			throw new Error("MINIO_BUCKET_NAME is required.");
		const client = mediaDomain && !dryRun ? createMinioClient() : undefined;
		const media =
			client && bucket
				? createImportMediaStore(
						{
							images: createImagesStorageService(client, bucket),
							books: createBooksStorageService(client, bucket),
						},
						sharpImageProcessor,
					)
				: undefined;
		const summary = await synchronizeContent(
			domain,
			owner,
			source(process.env.S_CONTENTS_PATH ?? process.cwd()),
			{
				repository: createContentImportRepository(prisma),
				clock: systemClock,
				media,
			},
			{
				dryRun,
				onProgress: (event) =>
					console.log(
						`${dryRun ? "[dry-run] " : ""}${event.action}: ${event.key}`,
					),
			},
		);
		console.log(summary);
		await notification
			.notifyInfo(`ingest-${domain} completed`, { caller: `ingest-${domain}` })
			.catch((error: unknown) => console.error("通知失敗:", error));
	} catch (error) {
		console.error(error);
		process.exitCode = 1;
		await notification
			.notifyError(`ingest-${domain} failed`, { caller: `ingest-${domain}` })
			.catch((notifyError: unknown) => console.error("通知失敗:", notifyError));
	} finally {
		await prisma.$disconnect();
	}
}
