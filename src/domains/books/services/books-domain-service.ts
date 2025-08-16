import "server-only";
import { DuplicateError } from "@/common/error/error-classes";
import type { IBooksQueryRepository } from "@/domains/books/types";
import { BookEntity } from "../entities/book.entity";
import { ISBN } from "../value-objects/isbn";

export class BooksDomainService {
	constructor(private readonly booksQueryRepository: IBooksQueryRepository) {}


	// Improved domain service methods using entities and value objects
	public async validateDuplicateBook(
		isbn: ISBN,
		userId: string,
	): Promise<void> {
		const exists = await this.booksQueryRepository.findByISBN(
			isbn.toString(),
			userId,
		);
		if (exists !== null) throw new DuplicateError();
	}

	public createNewBook(params: {
		isbn: string;
		title: string;
		userId: string;
	}): BookEntity {
		// Value Objectのバリデーションは内部で実行される
		return BookEntity.create({
			id: "", // IDジェネレーターで生成される
			ISBN: params.isbn,
			title: params.title,
			userId: params.userId,
			status: "UNEXPORTED",
			googleTitle: null,
			googleSubTitle: null,
			googleAuthors: null,
			googleDescription: null,
			googleImgSrc: null,
			googleHref: null,
			markdown: null,
		});
	}

	public async validateAndCreateBook(params: {
		isbn: string;
		title: string;
		userId: string;
	}): Promise<BookEntity> {
		// Create ISBN Value Object (throws if invalid)
		const isbn = ISBN.create(params.isbn);

		// Check for duplicate
		await this.validateDuplicateBook(isbn, params.userId);

		// Create and return entity
		return this.createNewBook(params);
	}
}
