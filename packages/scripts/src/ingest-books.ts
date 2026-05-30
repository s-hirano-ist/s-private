#!/usr/bin/env node
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
import matter from "gray-matter";
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import sharp from "sharp";

type BookFrontmatter = {
	heading?: string | number;
	title?: string;
	rating?: number;
	tags?: string[];
	googleSubtitle?: string | null;
	googleAuthors?: string[];
	googleDescription?: string | null;
	googleImgSrc?: string | null;
	googleHref?: string | null;
};

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

function arrayEquals(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	for (const [i, element] of a.entries()) {
		if (element !== b[i]) return false;
	}
	return true;
}

type ParsedBook = {
	title: string;
	markdown: string | null;
	rating: number;
	tags: string[];
	googleSubTitle: string | null;
	googleAuthors: string[];
	googleDescription: string | null;
	googleImgSrc: string | null;
	googleHref: string | null;
};

function parseBookFile(content: string): ParsedBook {
	const parsed = matter(content);
	const data = parsed.data as BookFrontmatter;

	// title: frontmatter.title を優先、無ければ本文の H1 からフォールバック
	let title = data.title?.trim() ?? "";
	if (!title) {
		const h1Match = /^# (.+)$/mu.exec(parsed.content);
		title = h1Match ? h1Match[1].trim() : "";
	}

	const body = parsed.content.trim();

	// oxlint-disable-next-line typescript/no-unnecessary-condition -- gray-matter parses arbitrary YAML; rating can be null at runtime despite the declared type
	if (data.rating === undefined || data.rating === null) {
		throw new Error(
			"rating は必須です (frontmatter に rating フィールドがありません)",
		);
	}

	return {
		title,
		markdown: body || null,
		rating: data.rating,
		tags: data.tags ?? [],
		googleSubTitle: data.googleSubtitle ?? null,
		googleAuthors: data.googleAuthors ?? [],
		googleDescription: data.googleDescription ?? null,
		googleImgSrc: data.googleImgSrc ?? null,
		googleHref: data.googleHref ?? null,
	};
}

type StoredBook = {
	title: string;
	markdown: string | null;
	imagePath: string | null;
	rating: number;
	tags: string[];
	googleSubTitle: string | null;
	googleAuthors: string[];
	googleDescription: string | null;
	googleImgSrc: string | null;
	googleHref: string | null;
};

function bookMatchesExisting(
	existing: StoredBook,
	parsed: ParsedBook,
	expectedImagePath: string | null,
): boolean {
	return (
		existing.title === parsed.title &&
		existing.markdown === parsed.markdown &&
		existing.imagePath === expectedImagePath &&
		existing.rating === parsed.rating &&
		arrayEquals(existing.tags, parsed.tags) &&
		existing.googleSubTitle === parsed.googleSubTitle &&
		arrayEquals(existing.googleAuthors, parsed.googleAuthors) &&
		existing.googleDescription === parsed.googleDescription &&
		existing.googleImgSrc === parsed.googleImgSrc &&
		existing.googleHref === parsed.googleHref
	);
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

	if (
		process.env.MINIO_USE_SSL === "true" &&
		(!process.env.CF_ACCESS_CLIENT_ID || !process.env.CF_ACCESS_CLIENT_SECRET)
	) {
		throw new Error(
			"CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET are required when MINIO_USE_SSL is true.",
		);
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
				rating: true,
				tags: true,
				googleSubTitle: true,
				googleAuthors: true,
				googleDescription: true,
				googleImgSrc: true,
				googleHref: true,
			},
		});
		type ExistingBook = (typeof existingBooks)[number];
		const existingBooksMap = new Map<string, ExistingBook>(
			existingBooks.map((b: ExistingBook) => [b.isbn, b]),
		);

		console.log(`📊 DB に ${existingBooksMap.size} 件の既存書籍があります。`);

		let insertedCount = 0;
		let updatedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		async function resolveNewImagePath(
			localImagePath: string | undefined,
			fallback: string | null,
		): Promise<string | null> {
			if (!localImagePath) return fallback;
			if (dryRun) return basename(localImagePath);
			return uploadBookImage(localImagePath);
		}

		async function updateExistingBook(
			existing: ExistingBook,
			parsed: ParsedBook,
			localImagePath: string | undefined,
			isbn: string,
			title: string,
			markdown: string | null,
		): Promise<void> {
			const newImagePath = await resolveNewImagePath(
				localImagePath,
				existing.imagePath,
			);

			if (dryRun) {
				console.log(`🔄 [dry-run] 更新予定: ${isbn} (${title})`);
				return;
			}

			await prisma.book.update({
				where: { id: existing.id },
				data: {
					title,
					markdown,
					imagePath: newImagePath,
					rating: parsed.rating,
					tags: parsed.tags,
					googleSubTitle: parsed.googleSubTitle,
					googleAuthors: parsed.googleAuthors,
					googleDescription: parsed.googleDescription,
					googleImgSrc: parsed.googleImgSrc,
					googleHref: parsed.googleHref,
				},
			});
			console.log(`🔄 更新: ${isbn} (${title})`);
		}

		async function createNewBook(
			parsed: ParsedBook,
			localImagePath: string | undefined,
			isbn: string,
			title: string,
			markdown: string | null,
		): Promise<void> {
			const newImagePath = await resolveNewImagePath(localImagePath, null);

			if (dryRun) {
				console.log(`🔍 [dry-run] 挿入予定: ${isbn} (${title})`);
				return;
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
					rating: parsed.rating,
					tags: parsed.tags,
					googleSubTitle: parsed.googleSubTitle,
					googleAuthors: parsed.googleAuthors,
					googleDescription: parsed.googleDescription,
					googleImgSrc: parsed.googleImgSrc,
					googleHref: parsed.googleHref,
				},
			});
			console.log(`✅ 挿入: ${isbn} (${title})`);
		}

		type ProcessResult = "inserted" | "updated" | "skipped" | "error";

		async function processBookFile(filePath: string): Promise<ProcessResult> {
			const rawIsbn = basename(filePath, ".md");
			let isbn = rawIsbn;
			let title = "";
			let markdown: string | null = null;
			try {
				isbn = makeISBN(rawIsbn);
				fileIsbns.add(isbn);

				const content = await readFile(filePath, "utf-8");
				const parsed = parseBookFile(content);
				title = parsed.title;
				markdown = parsed.markdown;

				if (!title) {
					console.error(`⚠️  タイトルなし: ${basename(filePath)}`);
					return "error";
				}

				const localImagePath = bookImageMap.get(isbn);
				const existing = existingBooksMap.get(isbn);

				if (existing) {
					const expectedImagePath = localImagePath
						? basename(localImagePath)
						: existing.imagePath;

					if (bookMatchesExisting(existing, parsed, expectedImagePath)) {
						return "skipped";
					}

					await updateExistingBook(
						existing,
						parsed,
						localImagePath,
						isbn,
						title,
						markdown,
					);
					return "updated";
				}

				await createNewBook(parsed, localImagePath, isbn, title, markdown);
				return "inserted";
			} catch (error) {
				console.error(
					`❌ エラー（${basename(filePath)}）:`,
					`isbn=${isbn}`,
					`title(${title.length}文字)`,
					`markdown(${(markdown ?? "").length}文字)`,
					error,
				);
				return "error";
			}
		}

		for (const filePath of files) {
			const result = await processBookFile(filePath);
			switch (result) {
				case "inserted":
					insertedCount++;
					break;
				case "updated":
					updatedCount++;
					break;
				case "skipped":
					skippedCount++;
					break;
				case "error":
					errorCount++;
					break;
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
		await notificationService.notifyError(
			`${SCRIPT_NAME} failed: ${String(error)}`,
			{
				caller: SCRIPT_NAME,
			},
		);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
