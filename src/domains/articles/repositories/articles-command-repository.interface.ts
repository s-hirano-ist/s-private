import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import type { Article } from "../entities/article-entity";

export type IArticlesCommandRepository = {
	create(data: Article): Promise<void>;
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};
