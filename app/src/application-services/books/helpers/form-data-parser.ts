import {
	makeBookTitle,
	makeISBN,
} from "s-private-domains/books/entities/books-entity";
import type { UserId } from "s-private-domains/common/entities/common-entity";
import { getFormDataString } from "@/common/utils/form-data-utils";

export const parseAddBooksFormData = (formData: FormData, userId: UserId) => {
	const ISBN = getFormDataString(formData, "isbn");
	const title = getFormDataString(formData, "title");

	return {
		ISBN: makeISBN(ISBN),
		title: makeBookTitle(title),
		userId,
	};
};
