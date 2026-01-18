/**
 * Note creation server action.
 *
 * @module
 */

"use server";
import "server-only";
import { noteEntity } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { domainServiceFactory } from "@/infrastructures/factories/domain-service-factory";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";
import { parseAddNoteFormData } from "./helpers/form-data-parser";

/**
 * Server action to create a new note.
 *
 * @remarks
 * Validates title uniqueness and creates markdown-based notes.
 * Requires dumper role permission.
 *
 * @param formData - Form data containing title and markdown content
 * @returns Server action result with success/failure status
 */
export async function addNote(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const notesDomainService = domainServiceFactory.createNotesDomainService();

	try {
		const { title, markdown, userId } = parseAddNoteFormData(
			formData,
			await getSelfId(),
		);

		// Domain business rule validation
		await notesDomainService.ensureNoDuplicate(title, userId);

		// Create entity with value objects
		const note = noteEntity.create({ title, markdown, userId });

		// Persist
		await notesCommandRepository.create(note);

		// Cache invalidation
		revalidateTag(buildContentCacheTag("notes", note.status, userId));
		revalidateTag(buildCountCacheTag("notes", note.status, userId));

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
