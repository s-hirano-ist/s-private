#!/usr/bin/env node
import {
	createObjectStorageClient,
	type ObjectStorageClient,
} from "@s-hirano-ist/s-storage";
import { basename, extname } from "node:path";
import {
	reportCliError,
	runCli,
	cliNotifications,
} from "./lib/cli-observability.js";
import { globPaths } from "./lib/glob-paths.js";

const SCRIPT_NAME = "cleanup-minio-images";

const ORIGINAL_IMAGE_PATH = "images/original";
const THUMBNAIL_IMAGE_PATH = "images/thumbnail";

function isImageFile(filePath: string): boolean {
	const ext = extname(filePath).toLowerCase();
	return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
}

function listObjects(
	client: ObjectStorageClient,
	bucket: string,
	prefix: string,
): Promise<string[]> {
	return client.listObjects(bucket, prefix);
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");

	const env = {
		S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	const contentsPath = process.env.S_CONTENTS_PATH ?? process.cwd();

	const notificationService = cliNotifications;

	const storageClient = createObjectStorageClient();

	const bucketName = env.S3_BUCKET_NAME ?? "";

	// 1. ローカルファイル一覧取得
	const localFiles = await globPaths(`${contentsPath}/image/dump/*`);
	const localFileNames = new Set(
		localFiles.filter((f) => isImageFile(f)).map((f) => basename(f)),
	);
	console.log(
		`📁 ローカルに ${localFileNames.size} 件の画像ファイルを検出しました。`,
	);

	// 2. S3オブジェクト一覧取得
	const [originalKeys, thumbnailKeys] = await Promise.all([
		listObjects(storageClient, bucketName, `${ORIGINAL_IMAGE_PATH}/`),
		listObjects(storageClient, bucketName, `${THUMBNAIL_IMAGE_PATH}/`),
	]);
	console.log(
		`📦 S3: original ${originalKeys.length} 件, thumbnail ${thumbnailKeys.length} 件`,
	);

	// 3. 差分検出
	const orphanedOriginals = originalKeys.filter(
		(key) => !localFileNames.has(basename(key)),
	);
	const orphanedThumbnails = thumbnailKeys.filter(
		(key) => !localFileNames.has(basename(key)),
	);

	const totalOrphaned = orphanedOriginals.length + orphanedThumbnails.length;
	if (totalOrphaned === 0) {
		console.log("✅ 孤立ファイルなし");
		if (!dryRun)
			await notificationService.notifyInfo(
				`${SCRIPT_NAME} completed: no orphaned files`,
				{ caller: SCRIPT_NAME },
			);
		return;
	}

	console.log(
		`🗑️  孤立ファイル検出: original ${orphanedOriginals.length} 件, thumbnail ${orphanedThumbnails.length} 件`,
	);

	// 4. 削除実行
	let deletedCount = 0;
	let errorCount = 0;

	for (const key of [...orphanedOriginals, ...orphanedThumbnails]) {
		try {
			if (dryRun) {
				console.log(`🔍 [dry-run] 削除予定: ${key}`);
			} else {
				await storageClient.removeObject(bucketName, key);
				console.log(`🗑️  削除: ${key}`);
			}
			deletedCount++;
		} catch (error) {
			reportCliError(error, "cleanup-minio-images");
			console.error(`❌ 削除エラー（${key}）:`, error);
			errorCount++;
		}
	}

	console.log(
		`\n📊 結果: 削除 ${deletedCount} 件, エラー ${errorCount} 件${dryRun ? " (dry-run)" : ""}`,
	);
	if (!dryRun)
		await notificationService.notifyInfo(`${SCRIPT_NAME} completed`, {
			caller: SCRIPT_NAME,
		});
}

await runCli("cleanup-minio-images", main);
