/**
 * Note creation server action.
 *
 * @module
 */

"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { requireAuth } from "@/common/auth/session";
import { addNoteCore } from "./add-note.core";
import { defaultAddNoteDeps } from "./add-note.deps";

/**
 * Server action to create a new note.
 *
 * @remarks
 * This is the public-facing Server Action that requires authentication,
 * then delegates to addNoteCore for business logic.
 *
 * Validates title uniqueness and creates markdown-based notes.
 *
 * @param formData - Form data containing title and markdown content
 * @returns Server action result with success/failure status
 */
export async function addNote(formData: FormData): Promise<ServerAction> {
	await requireAuth();

	return addNoteCore(formData, defaultAddNoteDeps);
}
