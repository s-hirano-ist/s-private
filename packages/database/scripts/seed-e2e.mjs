import { createPrismaClient, Status } from "../src/index.ts";

const databaseUrl = process.env.DATABASE_URL;
const localEmail = process.env.LOCAL_AUTH_EMAIL;

if (!databaseUrl || !localEmail) {
	throw new Error("DATABASE_URL and LOCAL_AUTH_EMAIL are required");
}

const prisma = createPrismaClient(databaseUrl);

try {
	const user = await prisma.user.findUnique({ where: { email: localEmail } });
	if (!user) {
		throw new Error(
			`Local user ${localEmail} does not exist. Visit /api/sign-in before seeding.`,
		);
	}

	const now = new Date("2026-01-01T00:00:00.000Z");
	const category = await prisma.category.upsert({
		where: { name_userId: { name: "E2E", userId: user.id } },
		update: {},
		create: {
			id: "00000000-0000-4000-8000-000000000001",
			name: "E2E",
			userId: user.id,
			createdAt: now,
			updatedAt: now,
		},
	});

	await Promise.all([
		prisma.article.upsert({
			where: {
				url_userId: {
					url: "https://example.com/e2e-article",
					userId: user.id,
				},
			},
			update: { status: Status.EXPORTED },
			create: {
				id: "00000000-0000-4000-8000-000000000002",
				title: "E2E seeded article",
				url: "https://example.com/e2e-article",
				quote: "Seeded by the hermetic E2E workflow",
				categoryId: category.id,
				status: Status.EXPORTED,
				userId: user.id,
				createdAt: now,
				updatedAt: now,
				exportedAt: now,
			},
		}),
		prisma.note.upsert({
			where: {
				title_userId: { title: "E2E seeded note", userId: user.id },
			},
			update: { status: Status.EXPORTED },
			create: {
				id: "00000000-0000-4000-8000-000000000003",
				title: "E2E seeded note",
				markdown: "# E2E seeded note\n\nHermetic viewer fixture.",
				status: Status.EXPORTED,
				userId: user.id,
				createdAt: now,
				updatedAt: now,
				exportedAt: now,
			},
		}),
		prisma.image.upsert({
			where: {
				path_userId: { path: "e2e/seeded-image.png", userId: user.id },
			},
			update: { status: Status.EXPORTED },
			create: {
				id: "00000000-0000-4000-8000-000000000004",
				path: "e2e/seeded-image.png",
				contentType: "image/png",
				fileSize: 68,
				width: 1,
				height: 1,
				status: Status.EXPORTED,
				userId: user.id,
				createdAt: now,
				updatedAt: now,
				exportedAt: now,
			},
		}),
		prisma.book.upsert({
			where: { isbn_userId: { isbn: "978-0000000002", userId: user.id } },
			update: { status: Status.EXPORTED },
			create: {
				id: "00000000-0000-4000-8000-000000000005",
				isbn: "978-0000000002",
				title: "E2E seeded book",
				googleAuthors: ["E2E Author"],
				rating: 5,
				tags: ["e2e"],
				markdown: "Hermetic viewer fixture.",
				status: Status.EXPORTED,
				userId: user.id,
				createdAt: now,
				updatedAt: now,
				exportedAt: now,
			},
		}),
	]);

	console.log(`Seeded E2E content for ${localEmail}`);
} finally {
	await prisma.$disconnect();
}
