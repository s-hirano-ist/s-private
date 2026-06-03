/**
 * Tenant context backed by AsyncLocalStorage.
 *
 * @remarks
 * Carries the current request's `userId` down to the Prisma client extension
 * (see {@link file://./tenant-filter.ts}) so that tenant isolation can be
 * enforced at the database layer as a defense-in-depth measure, independent of
 * the explicit `where: { userId }` filters in the repositories.
 *
 * AsyncLocalStorage is a Node.js-only primitive: this only works on the Node.js
 * runtime (not the Edge runtime). All data access in this app runs on Node.js.
 *
 * @module
 */

import { AsyncLocalStorage } from "node:async_hooks";

/**
 * The per-request tenant scope.
 *
 * @remarks
 * - `userId`: the authenticated owner of the data being accessed.
 * - `system`: when `true`, tenant filtering is bypassed entirely (reserved for
 *   future cron / migration / batch operations that legitimately span tenants).
 */
export type TenantStore = {
	userId: string;
	system?: boolean;
};

/**
 * AsyncLocalStorage holding the {@link TenantStore} for the current async call
 * tree. Read by the Prisma tenant extension; written via
 * {@link file://./with-tenant.ts | withSelfTenant} at server-action entrypoints.
 */
export const tenantContext = new AsyncLocalStorage<TenantStore>();
