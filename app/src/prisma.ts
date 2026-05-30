/**
 * Prisma client singleton for database access.
 *
 * @remarks
 * Implements the singleton pattern to prevent multiple Prisma instances
 * in development hot-reload. Includes:
 * - Query timing logs for performance monitoring
 * - Production error events routed to Sentry
 * - Minimal error format in production to avoid leaking query bodies / params
 *
 * @see {@link https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices | Prisma Next.js Best Practices}
 *
 * @module
 */

import { env } from "@/env";
import { PrismaClient, PrismaPg } from "@s-hirano-ist/s-database";
import * as Sentry from "@sentry/nextjs";

const isProduction = env.NODE_ENV === "production";

/**
 * Creates a configured Prisma client instance.
 *
 * @remarks
 * - `errorFormat: "minimal"` in production prevents query bodies and parameters
 *   from being included in error stack traces (which would otherwise be indexed
 *   by Sentry / Vercel logs).
 * - `log: [{ emit: "event", level: "error" }]` routes Prisma errors to Sentry
 *   without writing them to stdout.
 *
 * @internal
 */
const prismaClientSingleton = () => {
	const client = new PrismaClient({
		adapter: new PrismaPg({
			connectionString: env.DATABASE_URL,
			max: 3,
			idleTimeoutMillis: 30_000,
			connectionTimeoutMillis: 10_000,
		}),
		errorFormat: isProduction ? "minimal" : "pretty",
		log: [{ emit: "event", level: "error" }],
	});

	client.$on("error", (event) => {
		if (isProduction) {
			Sentry.captureException(new Error(event.message), {
				tags: { source: "prisma" },
				extra: { target: event.target, timestamp: event.timestamp },
			});
		} else {
			console.error(
				`[prisma error] ${event.target}: ${event.message}`,
				event.timestamp,
			);
		}
	});

	return client.$extends({
		query: {
			async $allOperations({ args, query, operation, model }) {
				const start = Date.now();
				const result = await query(args);
				const duration = Date.now() - start;
				if (!isProduction) {
					console.log(`[${model}.${operation}] took ${duration}ms`);
				}
				return result;
			},
		},
	});
};

// Required to extend globalThis for Prisma singleton pattern - caches client across hot-reloads in development
// oxlint-disable-next-line no-shadow-restricted-names
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
