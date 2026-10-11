import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getFormDataString } from "@/common/utils/form-data-utils";
import { parseArticleInput } from "@s-hirano-ist/s-backend/articles/use-cases";
export function parseAddArticleFormData(formData: FormData, userId: UserId) {
	return parseArticleInput(
		{
			title: getFormDataString(formData, "title"),
			quote: getFormDataString(formData, "quote"),
			url: getFormDataString(formData, "url"),
			category: getFormDataString(formData, "category"),
		},
		userId,
	);
}
