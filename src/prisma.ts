// In case of error of prisma on development environment
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
import { env } from "@/env";
import { PrismaClient } from "@prisma/client";
// import { PrismaClient } from "@prisma/client/edge"; // FIXME: for edge
import { withAccelerate } from "@prisma/extension-accelerate";

const prismaClientSingleton = () => {
	return new PrismaClient().$extends(withAccelerate());
};
// biome-ignore lint:
declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
