import { env } from "@/env.mjs";
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
	return new PrismaClient({ omit: { users: { password: true } } });
};

// biome-ignore lint: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
