// In case of error of prisma on development environment
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices

import { withAccelerate } from "@prisma/extension-accelerate";
import { env } from "@/env";
import { PrismaClient } from "@/generated";

const prismaClientSingleton = () => {
	const prisma = new PrismaClient().$extends({
		query: {
			async $allOperations({ args, query, operation, model }) {
				const start = Date.now();
				const result = await query(args);
				const duration = Date.now() - start;
				console.log(`[${model}.${operation}] took ${duration}ms`);
				return result;
			},
		},
	});

	return prisma.$extends(withAccelerate());
};

declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
