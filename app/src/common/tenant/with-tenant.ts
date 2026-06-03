/**
 * Tenant-scope entrypoint helper for server actions.
 *
 * @module
 */

import "server-only";
import { getSelfId } from "@/common/auth/session";
import { tenantContext } from "./tenant-context";

/**
 * Resolves the current user, then runs `fn` inside a tenant scope.
 *
 * @remarks
 * Establishes both authentication (via {@link getSelfId}, which redirects to the
 * unauthorized page when there is no session) and the AsyncLocalStorage tenant
 * scope read by the Prisma tenant extension. Use this at the entry of every
 * mutating server action so writes run with tenant isolation enforced at the DB
 * layer. Read paths set the scope directly with the userId they already hold.
 *
 * @param fn - The work to run within the tenant scope.
 * @returns The result of `fn`.
 */
export async function withSelfTenant<T>(fn: () => Promise<T>): Promise<T> {
	const userId = await getSelfId();
	return tenantContext.run({ userId }, fn);
}
