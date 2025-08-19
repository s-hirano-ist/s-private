import "server-only";
import { unauthorized } from "next/navigation";
import { SystemWarningEvent } from "@/domains/common/events/system-warning-event";
import { auth } from "@/infrastructures/auth/auth-provider";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";

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

export async function getSelfId() {
	const { user } = await checkSelfAuth();
	return user.id;
}

async function getSelfRoles() {
	const { user } = await checkSelfAuth();
	return user.roles;
}

// FOR viewer
export async function hasViewerAdminPermission() {
	const roles = await getSelfRoles();
	return roles.includes("viewer");
}

// FOR dumper
export async function hasDumperPostPermission() {
	const roles = await getSelfRoles();
	return roles.includes("dumper");
}
