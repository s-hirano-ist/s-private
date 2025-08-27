import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import type { UnexportedArticle, Url } from "../entities/article-entity";

export type IArticlesCommandRepository = {
	create?(data: UnexportedArticle): Promise<void>;
	update?(url: Url, userId: UserId, data: UnexportedArticle): Promise<void>;
	deleteById?(id: Id, userId: UserId, status: Status): Promise<void>;
};
