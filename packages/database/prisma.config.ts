/**
 * Prisma configuration for the database package.
 *
 * @remarks
 * This configuration file defines:
 * - Schema location for Prisma models
 * - Migration directory for database versioning
 * - Database connection URL from environment variables
 *
 * @see {@link https://www.prisma.io/docs/orm/prisma-schema | Prisma Schema Documentation}
 *
 * @module
 */

import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma configuration object.
 *
 * @remarks
 * Configures Prisma CLI and client generation with:
 * - Schema path: `prisma/schema.prisma`
 * - Migrations path: `prisma/migrations`
 * - Database URL: Read from `DATABASE_URL` environment variable
 *
 * @example
 * ```bash
 * # Generate Prisma client
 * pnpm prisma:generate
 *
 * # Run database migrations
 * pnpm prisma:migrate
 *
 * # Open Prisma Studio
 * pnpm prisma:studio
 * ```
 */
export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: process.env.DATABASE_URL ?? "",
	},
});
