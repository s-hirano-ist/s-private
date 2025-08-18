import type { Status, UserId } from "@/domains/common/entities/common-entity";
import type { Url } from "../entities/news-entity";
import type { NewsFindManyParams } from "../types/query-params";

export type INewsQueryRepository = {
	findByUrl(url: Url, userId: UserId): Promise<{} | null>;
	findMany(
		userId: UserId,
		status: Status,
		params: NewsFindManyParams,
	): Promise<
		{
			id: string;
			title: string;
			url: string;
			quote: string | null;
			ogTitle: string | null;
			ogDescription: string | null;
			Category: {
				id: string;
				name: string;
			};
		}[]
	>;
	count(userId: UserId, status: Status): Promise<number>;
};
