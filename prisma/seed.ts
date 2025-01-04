import fs from "node:fs";
import { join } from "node:path";
import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import matter from "gray-matter";
import sharp from "sharp";

const prisma = new PrismaClient();

const ADMIN_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
const VIEWER_SEED_PASSWORD = process.env.VIEWER_SEED_PASSWORD;
const UNAUTHORIZED_SEED_PASSWORD = process.env.UNAUTHORIZED_SEED_PASSWORD;

const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;

if (
	!ADMIN_SEED_PASSWORD ||
	!UNAUTHORIZED_SEED_PASSWORD ||
	!VIEWER_SEED_PASSWORD
)
	throw new Error("ENV undefined");

const SEED_USERS = [
	{ username: "s-hirano-ist", role: "ADMIN", password: ADMIN_SEED_PASSWORD },
	{ username: "viewer", role: "VIEWER", password: VIEWER_SEED_PASSWORD },
	{
		username: "unauthorized",
		role: "UNAUTHORIZED",
		password: UNAUTHORIZED_SEED_PASSWORD,
	},
] satisfies { username: string; password: string; role: Role }[];

async function addSampleUsers(username: string, password: string, role: Role) {
	const hashedPassword = await bcrypt.hash(password, 8);

	await prisma.users.upsert({
		where: { username },
		update: {},
		create: { username, password: hashedPassword, role },
		select: { id: true, Categories: true },
	});
}

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
		await Promise.all(
			SEED_USERS.map(async (user) => {
				await addSampleUsers(user.username, user.password, user.role);
			}),
		);
		console.log("Added users to the database");

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
