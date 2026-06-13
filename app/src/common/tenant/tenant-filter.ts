/**
 * Pure tenant-filter injection logic for the Prisma client extension.
 *
 * @remarks
 * This module is intentionally free of any Prisma / framework dependency so it
 * can be unit-tested directly (the real extension is bypassed under the global
 * `@/prisma` test mock). {@link file://./../../prisma.ts | prisma.ts} wires this
 * into a `Prisma.defineExtension` query interceptor for every tenant-scoped
 * model (Article / Note / Image / Book / Category).
 *
 * Policy ({@link TenantStore} = the current tenant scope, may be `undefined`):
 * - `system: true` → bypass everything (reserved for cron / migration).
 * - **Reads** (`findMany` / `findFirst` / `count` / `aggregate` / `groupBy`):
 *   fail-open. When a scope is present `userId` is AND-ed into `where`; when it
 *   is absent the query passes through unchanged (the repositories' explicit
 *   `where: { userId }` still isolates tenants). Reads can run inside a Next.js
 *   `unstable_cache` callback where AsyncLocalStorage may not propagate, so
 *   failing closed here would break cached reads.
 * - **Mutations** (`create` / `update` / `delete` / `*Many` / `upsert`):
 *   fail-closed. A missing scope throws, refusing to run a write with no tenant
 *   isolation. Mutations always run on the (non-cached) server-action path where
 *   the scope is reliably established.
 * - `findUnique` / `findUniqueOrThrow`: never rewritten — Prisma forbids `AND`
 *   in a unique selector. Tenant isolation relies on the composite-unique-key
 *   convention (`url_userId`, `title_userId`, …) which already embeds `userId`.
 *   Always query tenant models by such a composite key, never by a bare `id`.
 *
 * @module
 */

import type { TenantStore } from "./tenant-context";

/** Loose view of a Prisma operation's args, covering the fields we rewrite. */
type TenantQueryArgs = {
	where?: Record<string, unknown>;
	data?: Record<string, unknown> | Record<string, unknown>[];
	create?: Record<string, unknown>;
};

/** Operations whose generic `where` filter accepts an AND-wrapped userId. */
const WHERE_AND = new Set([
	"findMany",
	"findFirst",
	"findFirstOrThrow",
	"count",
	"aggregate",
	"groupBy",
	"updateMany",
	"deleteMany",
]);

/**
 * Operations whose `where` must keep a unique selector at the top level, so
 * `userId` is merged as a flat field instead of AND-wrapped.
 */
const WHERE_MERGE = new Set(["update", "delete", "upsert"]);

/** Operations that carry a create payload to stamp with `userId`. */
const WRITE_DATA = new Set(["create", "createMany", "upsert"]);

/** Operations that must never run without a tenant scope. */
const MUTATIONS = new Set([
	"create",
	"createMany",
	"update",
	"updateMany",
	"delete",
	"deleteMany",
	"upsert",
]);

/** Operations that are never rewritten (unique selector required). */
const PASSTHROUGH = new Set(["findUnique", "findUniqueOrThrow"]);

/**
 * Stamps `userId` onto the create payload(s) of a write operation.
 *
 * @internal
 */
function injectUserIdIntoData(
	args: TenantQueryArgs,
	userId: string,
	operation: string,
): void {
	if (operation === "upsert") {
		args.create = { ...args.create, userId };
		return;
	}
	if (Array.isArray(args.data)) {
		args.data = args.data.map((row) => ({ ...row, userId }));
		return;
	}
	args.data = { ...args.data, userId };
}

/**
 * Applies tenant isolation to a single Prisma operation's args.
 *
 * @param model - Prisma model name (used only for error messages).
 * @param operation - Prisma operation name (e.g. `"findMany"`, `"create"`).
 * @param args - The operation args (may be `undefined` for e.g. `count()`).
 * @param store - The current tenant scope, or `undefined` if none is set.
 * @returns The args to forward to the underlying query (possibly a new object).
 * @throws If a mutation is attempted with no tenant scope.
 */
export function applyTenantFilter(
	model: string,
	operation: string,
	args: unknown,
	store: TenantStore | undefined,
): unknown {
	// System operations (cron / migration) bypass tenant filtering entirely.
	if (store?.system) return args;

	if (!store) {
		if (MUTATIONS.has(operation)) {
			throw new Error(
				`Tenant context is required for mutation "${model}.${operation}" but none was set.`,
			);
		}
		// Fail-open for reads: rely on explicit where: { userId } in repositories.
		return args;
	}

	// Unique selectors cannot be AND-wrapped; rely on composite-key convention.
	if (PASSTHROUGH.has(operation)) return args;

	const { userId } = store;
	const next = (args ?? {}) as TenantQueryArgs;

	if (WRITE_DATA.has(operation)) {
		injectUserIdIntoData(next, userId, operation);
	}

	if (WHERE_AND.has(operation)) {
		next.where = { AND: [next.where ?? {}, { userId }] };
	} else if (WHERE_MERGE.has(operation)) {
		// update / delete / upsert keep their unique field at the top level and
		// override any caller-supplied userId so cross-tenant writes can't match.
		next.where = { ...next.where, userId };
	}

	return next;
}
