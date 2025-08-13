import "server-only";
import { InvalidFormatError } from "@/error-classes";
import { booksSchema } from "@/features/books/schemas/books-schema";

export function validateBooks(formData: FormData) {
	const booksValidatedFields = booksSchema.safeParse({
		ISBN: formData.get("isbn"),
		title: formData.get("title"),
	});
	if (!booksValidatedFields.success) throw new InvalidFormatError();

	return booksValidatedFields.data;
}
