"use server";
import "server-only";
import { noteEntity } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import { NotesDomainService } from "@s-hirano-ist/s-core/notes/services/notes-domain-service";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";
import { notesQueryRepository } from "@/infrastructures/notes/repositories/notes-query-repository";
import { parseAddNoteFormData } from "./helpers/form-data-parser";

export async function addNote(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const notesDomainService = new NotesDomainService(notesQueryRepository);

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
		revalidateTag(buildContentCacheTag("notes", note.status, userId), "max");
		revalidateTag(buildCountCacheTag("notes", note.status, userId), "max");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
