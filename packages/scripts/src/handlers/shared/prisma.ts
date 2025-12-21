import { PrismaClient } from "@s-hirano-ist/s-database";

let prismaInstance: PrismaClient | null = null;

export function getPrisma(databaseUrl: string): PrismaClient {
	if (!prismaInstance) {
		prismaInstance = new PrismaClient({ accelerateUrl: databaseUrl });
	}
	return prismaInstance;
}
