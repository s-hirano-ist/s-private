/**
 * Prisma client singleton for database access.
 *
 * @remarks
 * Implements the singleton pattern to prevent multiple Prisma instances
 * in development hot-reload. Includes:
 * - Prisma Accelerate for edge caching
 * - Query timing logs for performance monitoring
 *
 * @see {@link https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices | Prisma Next.js Best Practices}
 *
 * @module
 */

import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "@s-hirano-ist/s-database";
import { env } from "@/env";

/**
 * Creates a configured Prisma client instance.
 *
 * @remarks
 * Extends the base client with:
 * - Query timing middleware for all operations
 * - Prisma Accelerate extension for edge caching
 *
 * @internal
 */
const prismaClientSingleton = () => {
	const prisma = new PrismaClient({
		accelerateUrl: env.DATABASE_URL,
	}).$extends({
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

// biome-ignore lint: prisma template
declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

/**
 * Global Prisma client instance.
 *
 * @remarks
 * Uses singleton pattern to reuse client across hot-reloads in development.
 * In production, a new instance is created per serverless function invocation.
 */
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// Preserve client across hot-reloads in development
if (env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
