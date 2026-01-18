/**
 * Note creation server action.
 *
 * @module
 */

"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { addNoteCore } from "./add-note.core";
import { defaultAddNoteDeps } from "./add-note.deps";

/**
 * Server action to create a new note.
 *
 * @remarks
 * This is the public-facing Server Action that handles authentication and authorization,
 * then delegates to addNoteCore for business logic.
 *
 * Validates title uniqueness and creates markdown-based notes.
 * Requires dumper role permission.
 *
 * @param formData - Form data containing title and markdown content
 * @returns Server action result with success/failure status
 */
export async function addNote(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	return addNoteCore(formData, defaultAddNoteDeps);
}
