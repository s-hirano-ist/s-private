import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getFormDataString } from "@/common/utils/form-data-utils";
import { parseNoteInput } from "@s-hirano-ist/s-backend/notes/use-cases";
export function parseAddNoteFormData(formData: FormData, userId: UserId) {
	return parseNoteInput(
		{
			title: getFormDataString(formData, "title"),
			markdown: getFormDataString(formData, "markdown"),
		},
		userId,
	);
}
