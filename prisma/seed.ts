import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_USERS: { username: string; role: Role }[] = [
	{ username: "admin", role: "ADMIN" },
	{ username: "editor", role: "EDITOR" },
	{ username: "viewer", role: "VIEWER" },
];

async function addSampleData(username: string, password: string, role: Role) {
	const hashedPassword = await bcrypt.hash(password, 8);

	// UPSERT: if already exists then update, otherwise create
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
	const password = process.env.SEED_PASSWORD;
	if (!password) throw new Error("PASSWORD undefined.");

	try {
		await Promise.all(
			SEED_USERS.map(async (user) => {
				await addSampleData(user.username, password, user.role);
			}),
		);
		console.log("Added user to the database");
	} catch (error) {
		console.error(error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
