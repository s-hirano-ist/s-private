import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import {
	getFormDataFile,
	getFormDataString,
} from "@/common/utils/form-data-utils";
import { parseBookInput } from "@s-hirano-ist/s-backend/books/input";
export const parseAddBooksFormData = async (
	formData: FormData,
	userId: UserId,
) => {
	const isbn = getFormDataString(formData, "isbn");
	const title = getFormDataString(formData, "title");
	const rating = Number(getFormDataString(formData, "rating"));
	const tags = getFormDataString(formData, "tags")
		.split(",")
		.map((t) => t.trim())
		.filter((t) => t.length > 0);
	const image = getFormDataFile(formData, "image");
	return await parseBookInput({ isbn, title, rating, tags, image }, userId);
};
