/**
 * Note form data parsing utilities.
 *
 * @module
 */

import {
	makeMarkdown,
	makeNoteTitle,
} from "@s-hirano-ist/s-core/notes/entities/note-entity";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getFormDataString } from "@/common/utils/form-data-utils";

/**
 * Parses note creation form data into domain value objects.
 *
 * @param formData - Raw form data from note creation form
 * @param userId - Current user's ID
 * @returns Validated note data with domain value objects
 */
export const parseAddNoteFormData = (formData: FormData, userId: UserId) => {
	const title = getFormDataString(formData, "title");
	const markdown = getFormDataString(formData, "markdown");

	return {
		title: makeNoteTitle(title),
		markdown: makeMarkdown(markdown),
		userId: userId,
	};
};
