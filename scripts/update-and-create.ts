import fs from "node:fs";
import { join } from "node:path";
import * as Minio from "minio";
import sharp from "sharp";
import {
	makeArticleTitle,
	makeCategoryName,
	makeOgDescription,
	makeOgImageUrl,
	makeOgTitle,
	makeQuote,
	makeUrl,
} from "@/domains/articles/entities/article-entity";
import { ArticlesDomainService } from "@/domains/articles/services/articles-domain-service";
import {
	makeBookMarkdown,
	makeBookTitle,
	makeGoogleAuthors,
	makeGoogleDescription,
	makeGoogleHref,
	makeGoogleImgSrc,
	makeGoogleSubTitle,
	makeGoogleTitle,
	makeISBN,
} from "@/domains/books/entities/books-entity";
import { BooksDomainService } from "@/domains/books/services/books-domain-service";
import {
	makeUserId,
	type UserId,
} from "@/domains/common/entities/common-entity";
import {
	makeContentType,
	makeFileSize,
	makePath,
	makePixel,
} from "@/domains/images/entities/image-entity";
import { ImagesDomainService } from "@/domains/images/services/images-domain-service";
import {
	makeMarkdown,
	makeNoteTitle,
} from "@/domains/notes/entities/note-entity";
import { NotesDomainService } from "@/domains/notes/services/notes-domain-service";
import { articlesCommandRepository } from "@/infrastructures/articles/repositories/articles-command-repository";
import { articlesQueryRepository } from "@/infrastructures/articles/repositories/articles-query-repository";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";
import { notesQueryRepository } from "@/infrastructures/notes/repositories/notes-query-repository";
import { PrismaClient } from "../src/generated";

type Book = {
	ISBN: string;
	title: string;
	googleTitle: string;
	googleSubtitle: string;
	googleAuthors: string[];
	googleDescription: string;
	googleImgSrc: string;
	googleHref: string;
	tags: string[];
	rating: number;
};

async function fetchBookData(): Promise<Book[]> {
	const url =
		"https://raw.githubusercontent.com/s-hirano-ist/s-public/main/src/data/book/data.gen.json";
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch book data: ${response.statusText}`);
		}
		const data = await response.json();
		return data as Book[];
	} catch (error) {
		console.error("Error fetching book data:", error);
		throw error;
	}
}

// NOTE: sync with s-private/src/constants
export const ORIGINAL_IMAGE_PATH = "images/original";
export const THUMBNAIL_IMAGE_PATH = "images/thumbnail";
const THUMBNAIL_WIDTH = 192;
const THUMBNAIL_HEIGHT = 192;

const prisma = new PrismaClient();

const minioClient = new Minio.Client({
	endPoint: process.env.MINIO_HOST ?? "",
	port: Number(process.env.MINIO_PORT) ?? 9000,
	useSSL: true,
	accessKey: process.env.MINIO_ACCESS_KEY,
	secretKey: process.env.MINIO_SECRET_KEY,
});

const MINIO_BUCKET_NAME = process.env.MINIO_BUCKET_NAME;
if (!MINIO_BUCKET_NAME) throw new Error("Env not set.");

function getAllSlugs(contentsDirectory: string) {
	return fs
		.readdirSync(contentsDirectory)
		.filter((slug) => slug !== ".DS_Store");
}

function getMarkdownBySlug(slug: string, contentsDirectory: string) {
	const realSlug = slug.replace(/\.md$/, "");
	const fullPath = join(contentsDirectory, `${realSlug}.md`);
	const fileContents = fs.readFileSync(fullPath, "utf8");
	return fileContents;
}

function getJsonBySlug(slug: string, contentsDirectory: string) {
	const fullPath = join(contentsDirectory, slug);
	const fileContents = fs.readFileSync(fullPath, "utf8");
	return JSON.parse(fileContents);
}

async function optimizeImage(buffer: Buffer) {
	return await sharp(buffer)
		.resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
		.toBuffer();
}

async function addBooks(userId: UserId) {
	const path = "book";
	const contentsDirectory = join(process.cwd(), "markdown", path);

	const bookData = await fetchBookData();
	const slugs = getAllSlugs(contentsDirectory);

	const booksDomainService = new BooksDomainService(booksQueryRepository);

	await Promise.all(
		bookData.map(async (book) => {
			const slug = slugs.find((slug) => {
				const isbn = slug.replace(/\.md$/, "");
				return isbn === book.ISBN;
			});
			if (!slug)
				throw new Error(
					`Book data not found for title: ${book.title} ${book.ISBN}`,
				);

			const markdown = getMarkdownBySlug(slug, contentsDirectory);
			const ISBN = makeISBN(book.ISBN);

			const { status, data } = await booksDomainService.changeBookStatus(
				ISBN,
				userId,
				makeBookTitle(book.title),
				makeGoogleTitle(book.googleTitle),
				makeGoogleSubTitle(book.googleSubtitle),
				makeGoogleAuthors(book.googleAuthors),
				makeGoogleDescription(book.googleDescription),
				makeGoogleImgSrc(book.googleImgSrc),
				makeGoogleHref(book.googleHref),
				makeBookMarkdown(markdown),
			);
			switch (status) {
				case "NEED_CREATE": {
					console.log("NEW BOOK", ISBN);
					booksCommandRepository.create(data);
					return;
				}
				case "NEED_UPDATE":
					console.log("UPDATE BOOK", ISBN);
					booksCommandRepository.update(ISBN, userId, data);
					return;
				case "NO_UPDATE":
					return;
				default:
					status satisfies never;
			}
		}),
	);
	console.log("total books:", bookData.length);
	console.log("Added books to the database");
}

async function addImages(userId: UserId) {
	const path = "dump";
	const imagesDirectory = join(process.cwd(), "image", path);

	const slugs = getAllSlugs(imagesDirectory);
	const imagesDomainService = new ImagesDomainService(imagesQueryRepository);

	await Promise.all(
		slugs.map(async (slug) => {
			const uint8ArrayImage = fs.readFileSync(join(imagesDirectory, slug));
			const metadata = await sharp(uint8ArrayImage).metadata();

			const optimizedUint8ArrayImage = await optimizeImage(uint8ArrayImage);

			const originalPath = `${ORIGINAL_IMAGE_PATH}/${slug}`;
			const thumbnailPath = `${THUMBNAIL_IMAGE_PATH}/${slug}`;

			// Check if objects already exist before uploading
			try {
				await minioClient.statObject(MINIO_BUCKET_NAME ?? "", originalPath);
				console.log(`Original image already exists: ${originalPath}`);
			} catch (_error) {
				try {
					console.log(`adding image: ${originalPath}`);
					// Object doesn't exist, upload it
					await minioClient.putObject(
						MINIO_BUCKET_NAME ?? "",
						originalPath,
						uint8ArrayImage,
					);
				} catch (_error) {
					console.error("Unexpected error occurred");
				}
			}

			try {
				await minioClient.statObject(MINIO_BUCKET_NAME ?? "", thumbnailPath);
				console.log(`Thumbnail image already exists: ${thumbnailPath}`);
			} catch (_error) {
				try {
					// Object doesn't exist, upload it
					await minioClient.putObject(
						MINIO_BUCKET_NAME ?? "",
						thumbnailPath,
						optimizedUint8ArrayImage,
					);
				} catch (_error) {
					console.error("Unexpected error occurred");
				}
			}

			const path = makePath(slug);

			const { status, data } = await imagesDomainService.changeImageStatus(
				path,
				userId,
				makeContentType(metadata.format),
				makeFileSize(metadata.size ?? 0),
				makePixel(metadata.width),
				makePixel(metadata.height),
			);
			switch (status) {
				case "NEED_CREATE": {
					console.log("NEW IMAGE", path);
					imagesCommandRepository.create(data);
					return;
				}
				case "NEED_UPDATE":
					console.log("UPDATE IMAGE", path);
					imagesCommandRepository.update(path, userId, data);
					return;
				case "NO_UPDATE":
					return;
				default:
					status satisfies never;
			}
		}),
	);
	console.log("Added images to the database");
}

async function addArticles(userId: UserId) {
	const path = "article";
	const contentsDirectory = join(process.cwd(), "json", path);

	const slugs = getAllSlugs(contentsDirectory);
	const articlesDomainService = new ArticlesDomainService(
		articlesQueryRepository,
	);

	await Promise.all(
		slugs.map(async (slug) => {
			const json = getJsonBySlug(slug, contentsDirectory);

			json.body.map(
				async (item: {
					url: string;
					title: string;
					quote: string | null;
					ogImageUrl: string | null;
					ogTitle: string | null;
					ogDescription: string | null;
				}) => {
					const url = makeUrl(item.url);

					const { status, data } =
						await articlesDomainService.changeArticleStatus(
							url,
							makeCategoryName(json.heading),
							userId,
							makeArticleTitle(item.title),
							makeQuote(item.quote),
							makeOgTitle(item.ogTitle),
							makeOgDescription(item.ogDescription),
							makeOgImageUrl(item.ogImageUrl),
						);

					switch (status) {
						case "NEED_CREATE": {
							console.log("NEW ARTICLE", url);
							articlesCommandRepository.create(data);
							return;
						}
						case "NEED_UPDATE":
							console.log("UPDATE ARTICLE", url);
							articlesCommandRepository.update(url, userId, data);
							return;
						case "NO_UPDATE":
							return;
						default:
							status satisfies never;
					}
				},
			);
		}),
	);
	console.log("Added articles to the database");
}

async function addNotes(userId: UserId) {
	const path = "note";
	const contentsDirectory = join(process.cwd(), "markdown", path);

	const slugs = getAllSlugs(contentsDirectory);
	const notesDomainService = new NotesDomainService(notesQueryRepository);

	await Promise.all(
		slugs.map(async (slug) => {
			const title = makeNoteTitle(slug.replace(/\.md$/, ""));
			const markdown = makeMarkdown(getMarkdownBySlug(slug, contentsDirectory));

			const { status, data } = await notesDomainService.changeNoteStatus(
				title,
				userId,
				markdown,
			);
			switch (status) {
				case "NEED_CREATE": {
					console.log("NEW NOTE", title);
					notesCommandRepository.create(data);
					return;
				}
				case "NEED_UPDATE":
					console.log("UPDATE NOTE", title);
					notesCommandRepository.update(title, userId, data);
					return;
				case "NO_UPDATE":
					return;
				default:
					status satisfies never;
			}
		}),
	);
	console.log("Added notes to the database");
}

async function main() {
	try {
		const userId = makeUserId(process.env.USER_ID ?? "");

		await addArticles(userId);
		await addNotes(userId);
		await addBooks(userId);
		await addImages(userId);
	} catch (error) {
		console.error(error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
