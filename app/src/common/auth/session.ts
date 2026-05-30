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
import { auth } from "@/infrastructures/auth/auth-provider";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import { usersQueryRepository } from "@/infrastructures/users/repositories/users-query-repository";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { SystemWarningEvent } from "@s-hirano-ist/s-core/shared-kernel/events/system-warning-event";
import { makeRole } from "@s-hirano-ist/s-core/users/entities/user-entity";
import { unauthorized } from "next/navigation";
import { cache } from "react";

/**
 * Verifies the current session is authenticated.
 *
 * @throws Redirects to unauthorized page if session is invalid
 * @returns Authenticated session object
 *
 * @internal
 */
async function checkSelfAuth() {
	const session = await auth();
	if (!session) {
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
	const { user } = await checkSelfAuth();
	return makeUserId(user.id);
}

/**
 * Gets the current user's roles from the database.
 *
 * @remarks
 * Roles are the authorization source of truth, stored in the database
 * (`User.roles`). The session only carries the Auth0 identity. Wrapped in
 * React `cache()` to dedupe the lookup within a single request.
 *
 * @internal
 */
const getSelfRoles = cache(async () => {
	const { user } = await checkSelfAuth();
	return usersQueryRepository.findRolesById(makeUserId(user.id));
});

/**
 * Checks if the current user has viewer admin permission.
 *
 * @returns True if user has the "VIEWER" role
 */
export async function hasViewerAdminPermission() {
	const roles = await getSelfRoles();
	return roles.includes(makeRole("VIEWER"));
}

/**
 * Checks if the current user has dumper post permission.
 *
 * @returns True if user has the "DUMPER" role
 */
export async function hasDumperPostPermission() {
	const roles = await getSelfRoles();
	return roles.includes(makeRole("DUMPER"));
}
