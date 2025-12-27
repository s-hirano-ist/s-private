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

export type { Article, Book, Category, Image, Note } from "./generated";
// Re-export everything from generated Prisma client
// Note: We use separate exports to maintain proper ESM compatibility
export { $Enums, Prisma, PrismaClient, Status } from "./generated";
