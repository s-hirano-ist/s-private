import "server-only";
import type { IBooksQueryRepository } from "@/domains/books/types";
import {
	DuplicateError,
	InvalidFormatError,
} from "@/utils/error/error-classes";
import {
	type BooksFormSchema,
	booksFormSchema,
} from "../entities/books-entity";

export class BooksDomainService {
	constructor(private readonly booksQueryRepository: IBooksQueryRepository) {}

	public async prepareNewBook(
		formData: FormData,
		userId: string,
	): Promise<BooksFormSchema> {
		const formValues = {
			ISBN: formData.get("isbn") as string,
			title: formData.get("title") as string,
			userId,
			status: "UNEXPORTED",
		} satisfies Omit<BooksFormSchema, "id">;

		const booksValidatedFields = booksFormSchema.safeParse(formValues);
		if (!booksValidatedFields.success) throw new InvalidFormatError();

		// check duplicate
		const exists = await this.booksQueryRepository.findByISBN(
			booksValidatedFields.data.ISBN,
			userId,
		);
		if (exists !== null) throw new DuplicateError();

		return booksValidatedFields.data;
	}
}
