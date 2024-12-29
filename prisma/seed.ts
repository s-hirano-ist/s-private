import { PrismaClient, type Role, type Scope } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_USERS: { username: string; role: Role; scope: Scope }[] = [
	{ username: "admin-public", role: "ADMIN", scope: "PUBLIC" },
	{ username: "admin-private", role: "ADMIN", scope: "PRIVATE" },
	{ username: "editor-public", role: "EDITOR", scope: "PUBLIC" },
	{ username: "editor-private", role: "EDITOR", scope: "PRIVATE" },
	{ username: "viewer-public", role: "VIEWER", scope: "PUBLIC" },
	{ username: "viewer-private", role: "VIEWER", scope: "PRIVATE" },
];

async function addSampleData(
	username: string,
	password: string,
	role: Role,
	scope: Scope,
) {
	const hashedPassword = await bcrypt.hash(password, 8);

	// UPSERT: if already exists then update, otherwise create
	const user = await prisma.users.create({
		data: {
			username,
			password: hashedPassword,
			role,
			scope,
			Categories: { create: [{ name: `category-name-${role}-${scope}` }] },
		},
		select: { id: true, Categories: true },
	});
	await prisma.news.create({
		data: {
			title: `news-title-${role}-${scope}`,
			url: "https://example.com",
			userId: user.id,
			categoryId: user.Categories[0].id,
		},
	});
	await prisma.contents.create({
		data: {
			title: `contents-title-${role}-${scope}`,
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
				await addSampleData(user.username, password, user.role, user.scope);
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
