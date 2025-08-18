import { getFormDataString } from "@/common/utils/form-data-utils";
import { makeBookTitle, makeISBN } from "@/domains/books/entities/books-entity";
import { makeUserId } from "@/domains/common/entities/common-entity";

export const parseAddBooksFormData = (formData: FormData, userId: string) => {
	const ISBN = getFormDataString(formData, "isbn");
	const title = getFormDataString(formData, "title");

	return {
		ISBN: makeISBN(ISBN),
		title: makeBookTitle(title),
		userId: makeUserId(userId),
	};
};
