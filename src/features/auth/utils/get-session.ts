import "server-only";
import { ERROR_MESSAGES } from "@/constants";
import { NotAllowedError, UnauthorizedError } from "@/error-classes";
import { loggerWarn } from "@/pino";
import { auth } from "./auth";
import { hasDumperPostPermission, hasViewerAdminPermission } from "./role";

export async function checkSelfAuthOrThrow() {
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

export async function hasViewerAdminPermissionOrThrow() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) throw new NotAllowedError();
}

export async function hasDumperPostPermissionOrThrow() {
	const hasPostPermission = await hasDumperPostPermission();
	if (!hasPostPermission) throw new NotAllowedError();
}

export async function hasUpdateStatusPermissionOrThrow() {
	const hasUpdateStatusPermission = await hasDumperPostPermission();
	if (!hasUpdateStatusPermission) throw new NotAllowedError();
}

export async function getUserId() {
	const { user } = await checkSelfAuthOrThrow();
	return user.id;
}
