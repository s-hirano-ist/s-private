import fs from "node:fs";
import { join } from "node:path";
import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import matter from "gray-matter";

const prisma = new PrismaClient();

const ADMIN_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
const VIEWER_SEED_PASSWORD = process.env.VIEWER_SEED_PASSWORD;
const UNAUTHORIZED_SEED_PASSWORD = process.env.UNAUTHORIZED_SEED_PASSWORD;

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

	const user = await prisma.users.upsert({
		where: { username },
		update: {},
		create: {
			username,
			password: hashedPassword,
			role,
			Categories: { create: [{ name: `category-name-${role}` }] },
		},
		select: { id: true, Categories: true },
	});
	await prisma.news.create({
		data: {
			title: `news-title-${role}`,
			url: "https://example.com",
			userId: user.id,
			categoryId: user.Categories[0].id,
		},
	});
	await prisma.contents.create({
		data: {
			title: `contents-title-${role}`,
			url: "https://example.com",
			userId: user.id,
		},
	});
}

function getAllSlugs(contentsDirectory: string) {
	return fs
		.readdirSync(contentsDirectory)
		.filter((slug) => slug !== ".DS_Store");
}

function getContentsBySlug(slug: string, contentsDirectory: string) {
	const realSlug = slug.replace(/\.mdx$/, "");
	const fullPath = join(contentsDirectory, `${realSlug}.mdx`);
	const fileContents = fs.readFileSync(fullPath, "utf8");
	return matter(fileContents).content;
}

async function addContentsData() {
	const contentsDirectory = join(
		process.cwd(),
		"s-contents/markdown",
		"contents",
	);
	const slugs = getAllSlugs(contentsDirectory);
	await prisma.staticContents.deleteMany();
	Promise.all(
		slugs.map(async (slug) => {
			const title = slug;
			const data = getContentsBySlug(slug, contentsDirectory);
			await prisma.staticContents.create({ data: { title, data } });
		}),
	);
}

async function addBookData() {
	const contentsDirectory = join(process.cwd(), "s-contents/markdown", "books");
	const slugs = getAllSlugs(contentsDirectory);
	await prisma.staticBooks.deleteMany();
	Promise.all(
		slugs.map(async (slug) => {
			const title = slug;
			const data = getContentsBySlug(slug, contentsDirectory);
			await prisma.staticBooks.create({ data: { title, data } });
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
