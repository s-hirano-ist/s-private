import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import type { Content } from "../entities/contents-entity";

export type IContentsCommandRepository = {
	create(data: Content): Promise<void>;
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};
