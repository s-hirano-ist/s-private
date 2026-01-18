/**
 * Note deletion server action.
 *
 * @module
 */

"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { deleteNoteCore } from "./delete-note.core";
import { defaultDeleteNoteDeps } from "./delete-note.deps";

/**
 * Server action to delete a note.
 *
 * @remarks
 * This is the public-facing Server Action that handles authentication and authorization,
 * then delegates to deleteNoteCore for business logic.
 *
 * Only unexported notes can be deleted. Requires dumper role permission.
 *
 * @param id - Note ID to delete
 * @returns Server action result with success/failure status
 */
export async function deleteNote(id: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	return deleteNoteCore(id, defaultDeleteNoteDeps);
}
