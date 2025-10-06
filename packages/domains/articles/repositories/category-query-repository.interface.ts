import type { UserId } from "../../common/entities/common-entity";
import type { CategoryFindManyParams } from "../types/query-params";

export type ICategoryQueryRepository = {
	findMany(
		userId: UserId,
		params?: CategoryFindManyParams,
	): Promise<
		{
			id: string;
			name: string;
		}[]
	>;
};
