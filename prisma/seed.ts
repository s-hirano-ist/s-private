import fs from "node:fs";
import { join } from "node:path";
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from "@/constants";
import { PrismaClient } from "@prisma/client";
import matter from "gray-matter";
import sharp from "sharp";

const prisma = new PrismaClient();

function getImageBySlug(slug: string, imagesDirectory: string, ext: string) {
	const realSlug = slug.replace(/\.mdx$/, "");
	const fullPath = join(imagesDirectory, `${realSlug}.${ext}`);
	return fs.readFileSync(fullPath);
}

function getAllSlugs(contentsDirectory: string) {
	return fs
		.readdirSync(contentsDirectory)
		.filter((slug) => slug !== ".DS_Store");
}

function getMarkdownBySlug(slug: string, contentsDirectory: string) {
	const realSlug = slug.replace(/\.mdx$/, "");
	const fullPath = join(contentsDirectory, `${realSlug}.mdx`);
	const fileContents = fs.readFileSync(fullPath, "utf8");
	return matter(fileContents).content;
}

async function addContentsData() {
	const path = "contents";
	const contentsDirectory = join(process.cwd(), "s-contents/markdown", path);
	const imagesDirectory = join(process.cwd(), "s-contents/image", path);

	const slugs = getAllSlugs(contentsDirectory);
	await prisma.staticContents.deleteMany();
	await Promise.all(
		slugs.map(async (slug) => {
			const title = slug.replace(/\.mdx$/, "");
			const markdown = getMarkdownBySlug(slug, contentsDirectory);
			const uint8ArrayImage = getImageBySlug(slug, imagesDirectory, "svg");
			await prisma.staticContents.create({
				data: { title, markdown, uint8ArrayImage },
			});
		}),
	);
}

async function optimizeImage(fullPath: Buffer) {
	return await sharp(fullPath)
		.resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
		.toBuffer();
}

async function addBookData() {
	const path = "books";
	const contentsDirectory = join(process.cwd(), "s-contents/markdown", path);
	const imagesDirectory = join(process.cwd(), "s-contents/image", path);

	const slugs = getAllSlugs(contentsDirectory);
	await prisma.staticBooks.deleteMany();
	await Promise.all(
		slugs.map(async (slug) => {
			const title = slug.replace(/\.mdx$/, "");
			const markdown = getMarkdownBySlug(slug, contentsDirectory);
			const uint8ArrayImage = getImageBySlug(slug, imagesDirectory, "webp");
			const optimizedUint8ArrayImage = await optimizeImage(uint8ArrayImage);

			await prisma.staticBooks.create({
				data: { title, markdown, uint8ArrayImage: optimizedUint8ArrayImage },
			});
		}),
	);
}

async function main() {
	try {
		await addContentsData();
		console.log("Added contents to the database");

		await addBookData();
		console.log("Added books to the database");
	} catch (error) {
		console.error(error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
