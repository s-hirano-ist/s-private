import type { Id, Status, UserId } from "../../common/entities/common-entity";
import type { UnexportedArticle } from "../entities/article-entity";

export type IArticlesCommandRepository = {
	create(data: UnexportedArticle): Promise<void>;
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};
