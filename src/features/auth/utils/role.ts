import "server-only";
import { UnexpectedError } from "@/error-classes";
import { checkSelfAuthOrThrow } from "./get-session";

// FOR /contents/* and /all
export async function checkAdminPermission() {
	const { user } = await checkSelfAuthOrThrow();

	switch (user.role) {
		case "ADMIN":
			return true;
		case "EDITOR":
			return false;
		case "VIEWER":
			return false;
		case "UNAUTHORIZED":
			return false;
		default:
			throw new UnexpectedError();
	}
}

// FOR /dump/* posts action
export async function checkPostPermission() {
	const { user } = await checkSelfAuthOrThrow();

	switch (user.role) {
		case "ADMIN":
			return true;
		case "EDITOR":
			return true;
		case "VIEWER":
			return false;
		case "UNAUTHORIZED":
			return false;
		default:
			throw new UnexpectedError();
	}
}

// FOR drawer
export async function checkUpdateStatusPermission() {
	const { user } = await checkSelfAuthOrThrow();

	switch (user.role) {
		case "ADMIN":
			return true;
		case "EDITOR":
			return true;
		case "VIEWER":
			return false;
		case "UNAUTHORIZED":
			return false;
		default:
			throw new UnexpectedError();
	}
}
