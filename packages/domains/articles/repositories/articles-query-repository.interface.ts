import type { Status, UserId } from "../../common/entities/common-entity";
import type { Url } from "../entities/article-entity";
import type { ArticlesFindManyParams } from "../types/query-params";

export type IArticlesQueryRepository = {
	findByUrl(
		url: Url,
		userId: UserId,
	): Promise<{
		title: string;
		url: string;
		quote: string | null;
		ogTitle: string | null;
		ogDescription: string | null;
		ogImageUrl: string | null;
		status: string;
		Category: {
			id: string;
			name: string;
		};
	} | null>;
	findMany(
		userId: UserId,
		status: Status,
		params: ArticlesFindManyParams,
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
	search(
		query: string,
		userId: UserId,
		limit?: number,
	): Promise<
		{
			id: string;
			title: string;
			url: string;
			quote: string | null;
			ogTitle: string | null;
			ogDescription: string | null;
			Category: { id: string; name: string };
		}[]
	>;
};
