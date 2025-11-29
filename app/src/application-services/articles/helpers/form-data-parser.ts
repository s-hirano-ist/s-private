import {
	makeArticleTitle,
	makeCategoryName,
	makeQuote,
	makeUrl,
} from "@s-hirano-ist/s-core/articles/entities/article-entity";
import type { UserId } from "@s-hirano-ist/s-core/common/entities/common-entity";
import { getFormDataString } from "@/common/utils/form-data-utils";

export const parseAddArticleFormData = (formData: FormData, userId: UserId) => {
	const title = getFormDataString(formData, "title");
	const quote = getFormDataString(formData, "quote");
	const url = getFormDataString(formData, "url");
	const categoryName = getFormDataString(formData, "category");

	return {
		title: makeArticleTitle(title),
		quote: makeQuote(quote),
		url: makeUrl(url),
		categoryName: makeCategoryName(categoryName),
		userId,
	};
};
