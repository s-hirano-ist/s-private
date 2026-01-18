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
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { SystemWarningEvent } from "@s-hirano-ist/s-core/shared-kernel/events/system-warning-event";
import { unauthorized } from "next/navigation";
import { auth } from "@/infrastructures/auth/auth-provider";
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
 * Gets the current user's roles.
 *
 * @internal
 */
async function getSelfRoles() {
	const { user } = await checkSelfAuth();
	return user.roles;
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
