import "server-only";
import { UnexpectedError } from "@/error-classes";
import { checkSelfAuthOrThrow } from "./get-session";

// FOR contents
export async function hasContentsPermission() {
	const { user } = await checkSelfAuthOrThrow();

	switch (user.role) {
		case "ADMIN":
			return true;
		case "VIEWER":
			return false;
		case "UNAUTHORIZED":
			return false;
		default:
			user.role satisfies never;
			throw new UnexpectedError();
	}
}

// FOR dumper
export async function hasDumperPermission() {
	const { user } = await checkSelfAuthOrThrow();

	switch (user.role) {
		case "ADMIN":
			return true;
		case "VIEWER":
			return false;
		case "UNAUTHORIZED":
			return false;
		default:
			user.role satisfies never;
			throw new UnexpectedError();
	}
}
