import type { UserId } from "../../common/entities/common-entity";
import { DuplicateError } from "../../errors/error-classes";
import type { ISBN } from "../entities/books-entity";
import type { IBooksQueryRepository } from "../repositories/books-query-repository.interface";

async function ensureNoDuplicateBook(
	booksQueryRepository: IBooksQueryRepository,
	ISBN: ISBN,
	userId: UserId,
): Promise<void> {
	const exists = await booksQueryRepository.findByISBN(ISBN, userId);
	if (exists !== null) throw new DuplicateError();
}

export class BooksDomainService {
	constructor(private readonly booksQueryRepository: IBooksQueryRepository) {}

	public async ensureNoDuplicate(ISBN: ISBN, userId: UserId) {
		return ensureNoDuplicateBook(this.booksQueryRepository, ISBN, userId);
	}
}
