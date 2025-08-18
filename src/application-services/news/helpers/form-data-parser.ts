import { getFormDataString } from "@/common/utils/form-data-utils";
import { makeUserId } from "@/domains/common/entities/common-entity";
import {
	makeCategoryName,
	makeNewsTitle,
	makeQuote,
	makeUrl,
} from "@/domains/news/entities/news-entity";

export const parseAddNewsFormData = (formData: FormData, userId: string) => {
	const title = getFormDataString(formData, "title");
	const quote = getFormDataString(formData, "quote");
	const url = getFormDataString(formData, "url");
	const categoryName = getFormDataString(formData, "category");

	return {
		title: makeNewsTitle(title),
		quote: makeQuote(quote),
		url: makeUrl(url),
		categoryName: makeCategoryName(categoryName),
		userId: makeUserId(userId),
	};
};
