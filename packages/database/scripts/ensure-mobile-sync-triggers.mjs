import { createPrismaClient } from "../src/index.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const prisma = createPrismaClient(databaseUrl);
const domains = ["articles", "notes", "books", "images", "categories"];

try {
	for (const domain of domains) {
		const name = `mobile_${domain}_change`;
		const existing = await prisma.$queryRawUnsafe(
			"SELECT tgname FROM pg_catalog.pg_trigger WHERE tgname = $1",
			name,
		);
		if (existing.length > 0) continue;
		// CockroachDB requires each CREATE TRIGGER to be an independent statement.
		await prisma.$executeRawUnsafe(
			`CREATE TRIGGER ${name} AFTER INSERT OR UPDATE OR DELETE ON ${domain} FOR EACH ROW EXECUTE FUNCTION record_mobile_sync_change()`,
		);
	}
} finally {
	await prisma.$disconnect();
}
