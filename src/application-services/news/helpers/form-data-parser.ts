import { makeUserId } from "@/domains/common/entities/common-entity";
import {
	makeCategoryName,
	makeNewsTitle,
	makeQuote,
	makeUrl,
} from "@/domains/news/entities/news-entity";

export const parseAddNewsFormData = (formData: FormData, userId: string) => {
	const title = formData.get("title") as string;
	const quote = formData.get("quote") as string;
	const url = formData.get("url") as string;
	const categoryName = formData.get("category") as string;

	return {
		title: makeNewsTitle(title),
		quote: makeQuote(quote),
		url: makeUrl(url),
		categoryName: makeCategoryName(categoryName),
		userId: makeUserId(userId),
	};
};
