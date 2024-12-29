import "server-only";
import { UnexpectedError } from "@/error-classes";
import { checkSelfAuthOrThrow } from "./get-session";

// FOR contents
export async function hasContentsPermission() {
	const { user } = await checkSelfAuthOrThrow();

	switch (user.role) {
		case "ADMIN":
			return true;
		case "EDITOR":
			return false;
		case "VIEWER":
			return false;
		default: // UNAUTHORIZEDも含む
			throw new UnexpectedError();
	}
}

// FOR dumper
export async function hasDumperPermission() {
	const { user } = await checkSelfAuthOrThrow();

	switch (user.role) {
		case "ADMIN":
			return true;
		case "EDITOR":
			return true;
		case "VIEWER":
			return false;
		default: // UNAUTHORIZEDも含む
			throw new UnexpectedError();
	}
}
