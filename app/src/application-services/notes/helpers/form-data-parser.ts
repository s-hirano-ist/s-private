import { getFormDataString } from "@/common/utils/form-data-utils";
import type { UserId } from "@/domains/common/entities/common-entity";
import {
	makeMarkdown,
	makeNoteTitle,
} from "@/domains/notes/entities/note-entity";

export const parseAddNoteFormData = (formData: FormData, userId: UserId) => {
	const title = getFormDataString(formData, "title");
	const markdown = getFormDataString(formData, "markdown");

	return {
		title: makeNoteTitle(title),
		markdown: makeMarkdown(markdown),
		userId: userId,
	};
};
