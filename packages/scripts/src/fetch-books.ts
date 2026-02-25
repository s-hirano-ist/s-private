#!/usr/bin/env node
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
	makeUnexportedStatus,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { createMinioClient } from "@s-hirano-ist/s-storage";

type Book = {
	id: string;
	isbn: string;
	title: string;
	imagePath: string | null;
};

const OUTPUT_DIR = "markdown/book/";

async function main() {
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

	// Dynamic import for Prisma ESM compatibility
	const { PrismaClient } = await import("@s-hirano-ist/s-database/generated");
	const prisma = new PrismaClient({ accelerateUrl: env.DATABASE_URL ?? "" });

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const minioClient = createMinioClient();

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const UNEXPORTED: Status = makeUnexportedStatus();

	async function exportData(data: Book[]) {
		let skippedCount = 0;
		let exportedCount = 0;

		await mkdir(OUTPUT_DIR, { recursive: true });

		for (const item of data) {
			const filePath = `${OUTPUT_DIR}${item.isbn}.md`;

			// ファイルが既に存在する場合はスキップ
			try {
				await access(filePath);
				skippedCount++;
				continue;
			} catch {
				// ファイルが存在しない場合は書き出し
			}

			const frontmatter = [
				"---",
				`heading: ${item.isbn}`,
				`description: ${item.title}`,
				"draft: false",
				"---",
			].join("\n");
			await writeFile(filePath, `${frontmatter}\n\n# ${item.title}\n`);
			exportedCount++;
		}

		console.log(
			`💾 Markdown: ${exportedCount} 件書き出し, ${skippedCount} 件スキップ`,
		);
	}

	async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
		for (let attempt = 0; attempt < retries; attempt++) {
			try {
				return await fn();
			} catch (error) {
				if (attempt === retries - 1) throw error;
				const delay = 1000 * 2 ** attempt;
				console.warn(`⚠️ リトライ ${attempt + 1}/${retries} (${delay}ms後)...`);
				await new Promise((r) => setTimeout(r, delay));
			}
		}
		throw new Error("unreachable");
	}

	async function downloadBookImages(books: Book[]) {
		const outputDir = path.join(process.cwd(), "image/book");
		await mkdir(outputDir, { recursive: true });

		const booksWithImages = books.filter((book) => book.imagePath !== null);
		console.log(
			`📷 ${booksWithImages.length} 件の書籍画像をダウンロードします。`,
		);

		let skippedCount = 0;
		let downloadedCount = 0;

		for (const book of booksWithImages) {
			const { isbn, imagePath } = book;
			if (!imagePath) continue;

			const ext = path.extname(imagePath);
			const fileName = `${isbn}${ext}`;
			const filePath = path.join(outputDir, fileName);

			// ファイルが既に存在する場合はスキップ
			try {
				await access(filePath);
				skippedCount++;
				continue;
			} catch {
				// ファイルが存在しない場合はダウンロード
			}

			await withRetry(() =>
				minioClient.fGetObject(
					env.MINIO_BUCKET_NAME ?? "",
					`books/original/${imagePath}`,
					filePath,
				),
			);
			downloadedCount++;
		}
		console.log(
			`💾 書籍画像: ${downloadedCount} 件ダウンロード, ${skippedCount} 件スキップ`,
		);
	}

	async function fetchBooks() {
		const books = await prisma.book.findMany({
			where: { userId, status: UNEXPORTED },
		});
		console.log(`📊 ${books.length} 件のデータを取得しました。`);

		await exportData(books);
		await downloadBookImages(books);
	}

	try {
		await fetchBooks();
		await notificationService.notifyInfo("fetch-books completed", {
			caller: "fetch-books",
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(`fetch-books failed: ${error}`, {
			caller: "fetch-books",
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
