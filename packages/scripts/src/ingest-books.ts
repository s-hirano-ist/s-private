#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { makeISBN } from "@s-hirano-ist/s-core/books/entities/book-entity";
import {
	makeExportedStatus,
	makeId,
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { createMinioClient } from "@s-hirano-ist/s-storage";
import { glob } from "glob";
import sharp from "sharp";

const SCRIPT_NAME = "ingest-books";

const ORIGINAL_BOOK_IMAGE_PATH = "books/original";
const THUMBNAIL_BOOK_IMAGE_PATH = "books/thumbnail";
const THUMBNAIL_SIZE = 192;

function getContentType(filePath: string): string | null {
	const ext = extname(filePath).toLowerCase();
	switch (ext) {
		case ".jpg":
		case ".jpeg":
			return "image/jpeg";
		case ".png":
			return "image/png";
		case ".gif":
			return "image/gif";
		case ".webp":
			return "image/webp";
		default:
			return null;
	}
}

function parseBookFile(content: string): {
	title: string;
	markdown: string | null;
} {
	const lines = content.split("\n");
	let title = "";
	let bodyStartIndex = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line?.startsWith("# ")) {
			title = line.slice(2).trim();
			bodyStartIndex = i + 1;
			break;
		}
	}

	const body = lines.slice(bodyStartIndex).join("\n").trim();
	return { title, markdown: body || null };
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");

	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		PUSHOVER_URL: process.env.PUSHOVER_URL,
		PUSHOVER_USER_KEY: process.env.PUSHOVER_USER_KEY,
		PUSHOVER_APP_TOKEN: process.env.PUSHOVER_APP_TOKEN,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
		MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	if (process.env.MINIO_USE_SSL === "true") {
		if (
			!process.env.CF_ACCESS_CLIENT_ID ||
			!process.env.CF_ACCESS_CLIENT_SECRET
		) {
			throw new Error(
				"CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET are required when MINIO_USE_SSL is true.",
			);
		}
	}

	const contentsPath = process.env.S_CONTENTS_PATH ?? process.cwd();

	// Dynamic import for Prisma ESM compatibility
	const { createPrismaClient } = await import("@s-hirano-ist/s-database");
	const prisma = createPrismaClient(env.DATABASE_URL ?? "");

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const minioClient = createMinioClient();

	const bucketName = env.MINIO_BUCKET_NAME ?? "";

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const exported = makeExportedStatus();

	const fileIsbns = new Set<string>();

	async function uploadBookImage(localPath: string): Promise<string> {
		const fileName = basename(localPath);
		const buffer = await readFile(localPath);

		const originalKey = `${ORIGINAL_BOOK_IMAGE_PATH}/${fileName}`;
		try {
			await minioClient.statObject(bucketName, originalKey);
		} catch {
			await minioClient.putObject(bucketName, originalKey, buffer);
			console.log(`📤 MinIO アップロード（original）: ${fileName}`);
		}

		const thumbnailBuffer = await sharp(buffer)
			.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: "cover" })
			.toBuffer();
		const thumbnailKey = `${THUMBNAIL_BOOK_IMAGE_PATH}/${fileName}`;
		await minioClient.putObject(bucketName, thumbnailKey, thumbnailBuffer);

		return fileName;
	}

	async function ingestBooks() {
		const files = await glob(`${contentsPath}/markdown/book/*.md`);
		console.log(`📁 ${files.length} 件のファイルを検出しました。`);

		const imageFiles = await glob(`${contentsPath}/image/book/*`);
		const bookImageMap = new Map<string, string>();
		for (const f of imageFiles) {
			if (getContentType(f) === null) continue;
			const rawIsbn = basename(f, extname(f));
			try {
				const isbn = makeISBN(rawIsbn);
				bookImageMap.set(isbn, f);
			} catch {
				console.error(`⚠️  無効な画像ISBN: ${basename(f)}`);
			}
		}
		console.log(`🖼️  ${bookImageMap.size} 件の書籍画像を検出しました。`);

		const existingBooks = await prisma.book.findMany({
			where: { userId },
			select: {
				id: true,
				isbn: true,
				title: true,
				markdown: true,
				imagePath: true,
			},
		});
		const existingBooksMap = new Map(
			existingBooks.map(
				(b: {
					id: string;
					isbn: string;
					title: string;
					markdown: string | null;
					imagePath: string | null;
				}) => [b.isbn, b],
			),
		);
		console.log(`📊 DB に ${existingBooksMap.size} 件の既存書籍があります。`);

		let insertedCount = 0;
		let updatedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		for (const filePath of files) {
			const rawIsbn = basename(filePath, ".md");
			let isbn = rawIsbn;
			let title = "";
			let markdown: string | null = null;
			try {
				isbn = makeISBN(rawIsbn);
				fileIsbns.add(isbn);

				const content = await readFile(filePath, "utf-8");
				({ title, markdown } = parseBookFile(content));

				if (!title) {
					console.error(`⚠️  タイトルなし: ${basename(filePath)}`);
					errorCount++;
					continue;
				}

				const localImagePath = bookImageMap.get(isbn);
				const existing = existingBooksMap.get(isbn);

				if (existing) {
					const expectedImagePath = localImagePath
						? basename(localImagePath)
						: existing.imagePath;

					if (
						existing.title === title &&
						existing.markdown === markdown &&
						existing.imagePath === expectedImagePath
					) {
						skippedCount++;
						continue;
					}

					let newImagePath: string | null = existing.imagePath;
					if (localImagePath) {
						if (dryRun) {
							newImagePath = basename(localImagePath);
						} else {
							newImagePath = await uploadBookImage(localImagePath);
						}
					}

					if (dryRun) {
						console.log(`🔄 [dry-run] 更新予定: ${isbn} (${title})`);
					} else {
						await prisma.book.update({
							where: { id: existing.id },
							data: { title, markdown, imagePath: newImagePath },
						});
						console.log(`🔄 更新: ${isbn} (${title})`);
					}
					updatedCount++;
					continue;
				}

				let newImagePath: string | null = null;
				if (localImagePath) {
					if (dryRun) {
						newImagePath = basename(localImagePath);
					} else {
						newImagePath = await uploadBookImage(localImagePath);
					}
				}

				if (dryRun) {
					console.log(`🔍 [dry-run] 挿入予定: ${isbn} (${title})`);
					insertedCount++;
					continue;
				}

				await prisma.book.create({
					data: {
						id: String(makeId()),
						isbn,
						title,
						markdown,
						imagePath: newImagePath,
						status: exported.status,
						exportedAt: exported.exportedAt,
						userId,
						createdAt: new Date(),
						tags: [],
					},
				});
				insertedCount++;
				console.log(`✅ 挿入: ${isbn} (${title})`);
			} catch (error) {
				console.error(
					`❌ エラー（${basename(filePath)}）:`,
					`isbn=${isbn}`,
					`title(${title.length}文字)`,
					`markdown(${(markdown ?? "").length}文字)`,
					error,
				);
				errorCount++;
			}
		}

		return { insertedCount, updatedCount, skippedCount, errorCount };
	}

	async function purgeBooks(): Promise<number> {
		const exportedBooks = await prisma.book.findMany({
			where: { userId, status: exported.status },
			select: { id: true, isbn: true },
		});

		const toDelete = exportedBooks.filter(
			(b: { id: string; isbn: string }) => !fileIsbns.has(b.isbn),
		);

		if (toDelete.length === 0) {
			console.log("🗑️  削除対象なし");
			return 0;
		}

		let deletedCount = 0;
		for (const book of toDelete) {
			if (dryRun) {
				console.log(`🗑️  [dry-run] 削除予定: ${book.isbn}`);
			} else {
				await prisma.book.delete({ where: { id: book.id } });
				console.log(`🗑️  削除: ${book.isbn}`);
			}
			deletedCount++;
		}

		return deletedCount;
	}

	try {
		const { insertedCount, updatedCount, skippedCount, errorCount } =
			await ingestBooks();
		const deletedCount = await purgeBooks();
		console.log(
			`\n📊 結果: 挿入 ${insertedCount} 件, 更新 ${updatedCount} 件, スキップ ${skippedCount} 件, 削除 ${deletedCount} 件, エラー ${errorCount} 件${dryRun ? " (dry-run)" : ""}`,
		);
		await notificationService.notifyInfo(`${SCRIPT_NAME} completed`, {
			caller: SCRIPT_NAME,
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(`${SCRIPT_NAME} failed: ${error}`, {
			caller: SCRIPT_NAME,
		});
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
