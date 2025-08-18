import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import type { News } from "../entities/news-entity";

export type INewsCommandRepository = {
	create(data: News): Promise<void>;
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};
