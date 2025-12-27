/**
 * Session and authentication utilities.
 *
 * @remarks
 * Provides server-side authentication checks and role-based permissions.
 * All functions throw unauthorized() if session is invalid.
 *
 * @module
 */

import "server-only";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import { SystemWarningEvent } from "@s-hirano-ist/s-core/common/events/system-warning-event";
import { headers } from "next/headers";
import { unauthorized } from "next/navigation";
import { auth, type Role } from "@/infrastructures/auth/auth";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";

/**
 * Verifies the current session is authenticated.
 *
 * @throws Redirects to unauthorized page if session is invalid
 * @returns Authenticated session object
 *
 * @internal
 */
async function checkSelfAuth() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user) {
		initializeEventHandlers();
		await eventDispatcher.dispatch(
			new SystemWarningEvent({
				message: "Unauthorized",
				status: 401,
				caller: "checkSelfAuth",
			}),
		);
		unauthorized();
	}
	return session;
}

/**
 * Gets the current authenticated user's ID.
 *
 * @throws Redirects to unauthorized page if not authenticated
 * @returns User ID as a domain value object
 */
export async function getSelfId(): Promise<UserId> {
	const session = await checkSelfAuth();
	return makeUserId(session.user.id);
}

/**
 * Gets the current user's roles from the account cookie.
 *
 * @internal
 */
async function getSelfRoles(): Promise<Role[]> {
	// NOTE: Better AuthのStatelessモードでは、ロール情報はaccountCookieから取得する必要がある
	// 現時点では、Auth0のID Tokenからロールを取得する方法を調査中
	// 暫定的に空配列を返し、後で実装を完成させる
	// TODO: Auth0のカスタムクレームからロールを取得する実装
	const session = await checkSelfAuth();
	// Better Authのセッションにはカスタムフィールドが含まれないため、
	// 別の方法でロールを取得する必要がある
	return (session.user as unknown as { roles?: Role[] }).roles ?? [];
}

/**
 * Checks if the current user has viewer admin permission.
 *
 * @returns True if user has the "viewer" role
 */
export async function hasViewerAdminPermission() {
	const roles = await getSelfRoles();
	return roles.includes("viewer");
}

/**
 * Checks if the current user has dumper post permission.
 *
 * @returns True if user has the "dumper" role
 */
export async function hasDumperPostPermission() {
	const roles = await getSelfRoles();
	return roles.includes("dumper");
}
