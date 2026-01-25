/**
 * Article form data parsing utilities.
 *
 * @remarks
 * Converts raw FormData into validated domain value objects.
 *
 * @module
 */

import {
	makeArticleTitle,
	makeCategoryName,
	makeQuote,
	makeUrl,
} from "@s-hirano-ist/s-core/articles/entities/article-entity";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getFormDataString } from "@/common/utils/form-data-utils";

/**
 * Parses article creation form data into domain value objects.
 *
 * @param formData - Raw form data from article creation form
 * @param userId - Current user's ID
 * @returns Validated article data with domain value objects
 */
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
