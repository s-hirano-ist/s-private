import "server-only";
import { unauthorized } from "next/navigation";
import { auth } from "@/infrastructures/auth/auth-provider";
import { serverLogger } from "@/infrastructures/observability/server";

async function checkSelfAuth() {
	const session = await auth();
	if (!session) {
		serverLogger.warn("Unauthorized", {
			caller: "checkSelfAuth",
			status: 401,
		});
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
