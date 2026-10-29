import type { ISBN } from "@s-hirano-ist/s-core/books/entities/book-entity";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
/** Domain duplication checks need existence, not a reconstructed content lifecycle. */
export type IBooksQueryRepository = {
	existsByISBN(key: ISBN, userId: UserId): Promise<boolean>;
};
