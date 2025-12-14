import type { Id, Status, UserId } from "../../common/entities/common-entity";
import type { UnexportedBook } from "../entities/books-entity";

export type IBooksCommandRepository = {
	create(data: UnexportedBook): Promise<void>;
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
	fetchBookFromGitHub(): Promise<UnexportedBook[]>;
};
