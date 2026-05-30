/**
 * Session and authentication utilities.
 *
 * @remarks
 * Provides server-side authentication checks. Authentication is the only
 * authorization gate: a signed-in user is the owner and may perform any
 * operation. All functions throw unauthorized() if the session is invalid.
 *
 * @module
 */

import "server-only";
import { auth } from "@/infrastructures/auth/auth-provider";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { SystemWarningEvent } from "@s-hirano-ist/s-core/shared-kernel/events/system-warning-event";
import { unauthorized } from "next/navigation";

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
 * Ensures the current request is authenticated.
 *
 * @remarks
 * The only authorization gate in the app: a signed-in user is the owner and
 * may perform any operation. Use this at server-action / page boundaries that
 * do not otherwise need the user ID.
 *
 * @throws Redirects to unauthorized page if not authenticated
 */
export async function requireAuth(): Promise<void> {
	await checkSelfAuth();
}
