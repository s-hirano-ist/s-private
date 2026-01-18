/**
 * Core business logic for note creation.
 *
 * @remarks
 * NOT a Server Action - for internal use and testing only.
 *
 * @module
 */

import "server-only";
import { noteEntity } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import { revalidateTag } from "next/cache";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import type { AddNoteDeps } from "./add-note.deps";
import { parseAddNoteFormData } from "./helpers/form-data-parser";

/**
 * Core business logic for creating a note.
 *
 * @remarks
 * This function contains the pure business logic without authentication/authorization.
 * It is designed to be easily testable by accepting dependencies as parameters.
 *
 * @param formData - Form data containing title and markdown content
 * @param deps - Dependencies (repository, domain service factory, event dispatcher)
 * @returns Server action result with success/failure status
 */
export async function addNoteCore(
	formData: FormData,
	deps: AddNoteDeps,
): Promise<ServerAction> {
	const { commandRepository, domainServiceFactory, eventDispatcher } = deps;
	const notesDomainService = domainServiceFactory.createNotesDomainService();

	try {
		const { title, markdown, userId } = parseAddNoteFormData(
			formData,
			await getSelfId(),
		);

		// Domain business rule validation
		await notesDomainService.ensureNoDuplicate(title, userId);

		// Create entity with value objects and domain event
		const [note, event] = noteEntity.create({
			title,
			markdown,
			userId,
			caller: "addNote",
		});

		// Persist
		await commandRepository.create(note);

		// Dispatch domain event
		await eventDispatcher.dispatch(event);

		// Cache invalidation
		revalidateTag(buildContentCacheTag("notes", note.status, userId));
		revalidateTag(buildCountCacheTag("notes", note.status, userId));

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
