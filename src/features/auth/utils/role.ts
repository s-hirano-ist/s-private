import "server-only";
import { ERROR_MESSAGES } from "@/constants";
import { UnauthorizedError } from "@/error-classes";
import { loggerWarn } from "@/pino";
import { auth } from "./auth";

async function checkSelfAuthOrThrow() {
	const session = await auth();
	if (!session) {
		loggerWarn(ERROR_MESSAGES.UNAUTHORIZED, {
			caller: "Unauthorized on checkSelfAuth or throw",
			status: 401,
		});
		throw new UnauthorizedError();
	}
	return session;
}

export async function getSelfId() {
	const { user } = await checkSelfAuthOrThrow();
	return user.id;
}

async function getSelfRoles() {
	const { user } = await checkSelfAuthOrThrow();
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
