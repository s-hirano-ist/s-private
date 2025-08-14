import "server-only";
import { booksSchema } from "@/features/books/schemas/books-schema";
import { InvalidFormatError } from "@/utils/error/error-classes";

export function validateBooks(formData: FormData) {
	const booksValidatedFields = booksSchema.safeParse({
		ISBN: formData.get("isbn"),
		title: formData.get("title"),
	});
	if (!booksValidatedFields.success) throw new InvalidFormatError();

	return booksValidatedFields.data;
}
