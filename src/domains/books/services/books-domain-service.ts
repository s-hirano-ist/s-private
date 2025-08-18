import "server-only";
import { DuplicateError } from "@/common/error/error-classes";
import type { IBooksQueryRepository } from "@/domains/books/types";
import type { UserId } from "@/domains/common/entities/common-entity";
import type { ISBN } from "../entities/books-entity";

export class BooksDomainService {
	constructor(private readonly booksQueryRepository: IBooksQueryRepository) {}

	public async ensureNoDuplicate(ISBN: ISBN, userId: UserId): Promise<void> {
		const exists = await this.booksQueryRepository.findByISBN(ISBN, userId);
		if (exists !== null) throw new DuplicateError();
	}
}
