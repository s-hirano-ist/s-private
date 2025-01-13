import "server-only";
import { checkSelfAuthOrThrow } from "./get-session";

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
