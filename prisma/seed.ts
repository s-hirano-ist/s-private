import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
const EDITOR_SEED_PASSWORD = process.env.EDITOR_SEED_PASSWORD;
const VIEWER_SEED_PASSWORD = process.env.VIEWER_SEED_PASSWORD;

if (!ADMIN_SEED_PASSWORD || !EDITOR_SEED_PASSWORD || !VIEWER_SEED_PASSWORD)
	throw new Error("ENV undefined");

const SEED_USERS = [
	{ username: "s-hirano-ist", role: "ADMIN", password: ADMIN_SEED_PASSWORD },
	{ username: "editor", role: "EDITOR", password: EDITOR_SEED_PASSWORD },
	{ username: "viewer", role: "VIEWER", password: VIEWER_SEED_PASSWORD },
] satisfies { username: string; password: string; role: Role }[];

async function addSampleUsers(username: string, password: string, role: Role) {
	const hashedPassword = await bcrypt.hash(password, 8);

	const user = await prisma.users.create({
		data: {
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

async function main() {
	try {
		await Promise.all(
			SEED_USERS.map(async (user) => {
				await addSampleUsers(user.username, user.password, user.role);
			}),
		);
		console.log("Added users to the database");
	} catch (error) {
		console.error(error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
