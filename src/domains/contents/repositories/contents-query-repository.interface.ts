import type { Status, UserId } from "@/domains/common/entities/common-entity";
import type { ContentTitle } from "../entities/contents-entity";
import type { ContentsFindManyParams } from "../types/query-params";

export type IContentsQueryRepository = {
	findByTitle(
		title: ContentTitle,
		userId: UserId,
	): Promise<{ id: string; title: string; markdown: string } | null>;
	findMany(
		userId: UserId,
		status: Status,
		params: ContentsFindManyParams,
	): Promise<Array<{ id: string; title: string }>>;
	count(userId: UserId, status: Status): Promise<number>;
};
