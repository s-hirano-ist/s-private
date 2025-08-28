import type { UserId } from "@/domains/common/entities/common-entity";
import {
	bookEntity,
	makeISBN,
	type UnexportedBook,
} from "@/domains/books/entities/books-entity";

type BooksExportRepository = {
	findUnexported(userId: UserId): Promise<
		Array<{ ISBN: string; userId: string }>
	>;
	markAsExported(ISBN: string, userId: UserId): Promise<void>;
};

export class BooksExportService {
	constructor(
		private readonly booksExportRepository: BooksExportRepository,
	) {}

	public async exportUnexportedBooks(userId: UserId) {
		const unexportedBooks = await this.booksExportRepository.findUnexported(
			userId,
		);

		const exportResults = await Promise.all(
			unexportedBooks.map(async (book) => {
				const isbn = makeISBN(book.ISBN);

				const unexportedBook: UnexportedBook = {
					id: "",
					userId,
					ISBN: isbn,
					title: "" as any,
					status: "UNEXPORTED",
					createdAt: "",
				};

				const exportedBook = bookEntity.export(unexportedBook);

				await this.booksExportRepository.markAsExported(isbn, userId);

				return exportedBook;
			}),
		);

		return exportResults;
	}
}