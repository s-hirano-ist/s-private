import "server-only";
import { ERROR_MESSAGES } from "@/constants";
import { NotAllowedError, UnauthorizedError } from "@/error-classes";
import { loggerWarn } from "@/pino";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { hasContentsPermission, hasDumperPermission } from "./role";

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

export async function checkSelfAuthOrRedirectToAuth() {
	const session = await auth();
	if (!session) {
		loggerWarn(ERROR_MESSAGES.UNAUTHORIZED, {
			caller: "Unauthorized on checkSelfAuth or redirect",
			status: 401,
		});
		// FIXME: https://github.com/s-hirano-ist/s-private/issues/440
		redirect("/auth"); // WHEN MIDDLEWARE DO NOT WORK
	}
	return session;
}

export async function hasAdminPermissionOrThrow() {
	const hasAdminPermission = await hasContentsPermission();
	if (!hasAdminPermission) throw new NotAllowedError();
}

export async function hasSelfPostPermissionOrThrow() {
	const hasPostPermission = await hasDumperPermission();
	if (!hasPostPermission) throw new NotAllowedError();
}

export async function hasUpdateStatusPermissionOrThrow() {
	const hasUpdateStatusPermission = await hasDumperPermission();
	if (!hasUpdateStatusPermission) throw new NotAllowedError();
}

export async function getUserId() {
	const { user } = await checkSelfAuthOrThrow();
	return user.id;
}

export async function getSelfRole() {
	const { user } = await checkSelfAuthOrThrow();
	return user.role;
}
