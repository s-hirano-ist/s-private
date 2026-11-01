import type { IBooksQueryRepository } from "@s-hirano-ist/s-core/books/repositories/books-query-repository.interface";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
export function createBooksQueryRepository(
	prisma: Pick<DatabaseClient, "book">,
): IBooksQueryRepository {
	return {
		async existsByISBN(isbn, userId) {
			return (
				(await prisma.book.findUnique({
					where: { isbn_userId: { isbn, userId } },
					select: { id: true },
				})) !== null
			);
		},
	};
}
