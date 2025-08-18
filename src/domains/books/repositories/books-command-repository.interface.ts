import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import type { Book } from "../entities/books-entity";

export type IBooksCommandRepository = {
	create(data: Book): Promise<void>;
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};
