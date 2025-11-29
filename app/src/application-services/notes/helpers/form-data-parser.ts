import type { UserId } from "s-core/common/entities/common-entity";
import { makeMarkdown, makeNoteTitle } from "s-core/notes/entities/note-entity";
import { getFormDataString } from "@/common/utils/form-data-utils";

export const parseAddNoteFormData = (formData: FormData, userId: UserId) => {
	const title = getFormDataString(formData, "title");
	const markdown = getFormDataString(formData, "markdown");

	return {
		title: makeNoteTitle(title),
		markdown: makeMarkdown(markdown),
		userId: userId,
	};
};
