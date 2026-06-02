/**
 * @packageDocumentation
 *
 * Database package providing Prisma client and types for the content management system.
 *
 * @remarks
 * This package wraps the Prisma ORM client and provides:
 * - Type-safe database access via PrismaClient
 * - Generated TypeScript types for all database models
 * - PostgreSQL database connectivity
 *
 * ## Database Models
 *
 * - **Category** - Hierarchical organization for articles
 * - **Article** - News/link management with OG metadata
 * - **Note** - Markdown-based content storage
 * - **Image** - File metadata with MinIO path storage
 * - **Book** - ISBN-based book tracking with Google Books integration
 *
 * ## Status Lifecycle
 *
 * All content models follow a common status workflow:
 * - `UNEXPORTED` - Initial state, content not yet published
 * - `LAST_UPDATED` - Content has been modified since last export
 * - `EXPORTED` - Content has been published/exported
 *
 * ## Multi-tenant Design
 *
 * All models include `userId` for data isolation between users.
 * Unique constraints are scoped per user (e.g., `@@unique([url, userId])`).
 *
 * @example
 * ```typescript
 * import { PrismaClient } from "@s-hirano-ist/s-database";
 *
 * const prisma = new PrismaClient();
 *
 * // Fetch all unexported articles for a user
 * const articles = await prisma.article.findMany({
 *   where: {
 *     userId: "user-123",
 *     status: "UNEXPORTED",
 *   },
 *   include: { Category: true },
 * });
 * ```
 *
 * @see {@link https://www.prisma.io/docs | Prisma Documentation}
 */

export { PrismaPg } from "@prisma/adapter-pg";
export type { Article, Book, Category, Image, Note } from "./generated";
// Re-export everything from generated Prisma client
// Note: We use separate exports to maintain proper ESM compatibility
export { $Enums, Prisma, PrismaClient, Status } from "./generated";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated";

export function createPrismaClient(databaseUrl: string) {
	return new PrismaClient({
		adapter: new PrismaPg({
			connectionString: databaseUrl,
			max: 5,
			idleTimeoutMillis: 30_000,
			connectionTimeoutMillis: 10_000,
		}),
	});
}

/**
 * Postgres / Prisma error codes that signal a serialization conflict and are
 * safe to retry.
 *
 * @remarks
 * CockroachDB defaults to `SERIALIZABLE` isolation and aborts conflicting
 * transactions with SQLSTATE `40001`. Prisma surfaces the same condition as
 * `P2034` ("Transaction failed due to a write conflict or a deadlock"). Unlike
 * some Postgres drivers, Prisma does not retry these automatically.
 */
const SERIALIZATION_RETRY_CODES = new Set(["40001", "P2034"]);

function isRetryableTransactionError(error: unknown): boolean {
	if (typeof error !== "object" || error === null) return false;
	const code = (error as { code?: unknown }).code;
	return typeof code === "string" && SERIALIZATION_RETRY_CODES.has(code);
}

/**
 * Runs a database operation, retrying it on CockroachDB serialization
 * conflicts (`40001` / Prisma `P2034`) with exponential backoff.
 *
 * @remarks
 * Wrap multi-statement transactions (`prisma.$transaction([...])`) and any
 * write that may contend under `SERIALIZABLE` isolation. Non-retryable errors
 * are rethrown immediately.
 *
 * @param fn - The operation to execute (and possibly re-execute).
 * @param options.maxRetries - Maximum retry attempts after the first try (default 5).
 * @param options.baseDelayMs - Base backoff delay in milliseconds (default 50).
 *
 * @example
 * ```typescript
 * await withTransactionRetry(() =>
 *   prisma.$transaction([
 *     prisma.book.updateMany({ ... }),
 *     prisma.book.updateMany({ ... }),
 *   ]),
 * );
 * ```
 */
export async function withTransactionRetry<T>(
	fn: () => Promise<T>,
	options: { maxRetries?: number; baseDelayMs?: number } = {},
): Promise<T> {
	const { maxRetries = 5, baseDelayMs = 50 } = options;
	let attempt = 0;
	for (;;) {
		try {
			return await fn();
		} catch (error) {
			if (attempt >= maxRetries || !isRetryableTransactionError(error)) {
				throw error;
			}
			const delay = baseDelayMs * 2 ** attempt;
			await new Promise((resolve) => {
				setTimeout(resolve, delay);
			});
			attempt += 1;
		}
	}
}
