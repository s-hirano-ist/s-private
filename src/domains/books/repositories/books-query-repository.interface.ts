import type { Status, UserId } from "@/domains/common/entities/common-entity";
import type { ISBN } from "../entities/books-entity";
import type { BooksFindManyParams } from "../types/query-params";

export type IBooksQueryRepository = {
	findByISBN(
		ISBN: ISBN,
		userId: UserId,
	): Promise<{
		ISBN: string;
		id: string;
		title: string;
		googleTitle: string | null;
		googleSubTitle: string | null;
		googleAuthors: string[];
		googleDescription: string | null;
		googleImgSrc: string | null;
		googleHref: string | null;
		markdown: string | null;
		rating: number | null;
		tags: string[];
		status: string;
		createdAt: Date;
		updatedAt: Date;
		exportedAt: Date | null;
	} | null>;
	findMany(
		userId: string,
		status: Status,
		params?: BooksFindManyParams,
	): Promise<
		{
			ISBN: string;
			id: string;
			title: string;
			googleTitle: string | null;
			googleSubTitle: string | null;
			googleAuthors: string[];
			googleDescription: string | null;
			googleImgSrc: string | null;
			googleHref: string | null;
			markdown: string | null;
			rating: number | null;
			tags: string[];
			createdAt: Date;
			updatedAt: Date;
			exportedAt: Date | null;
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
			ISBN: string;
			googleTitle: string | null;
			googleSubTitle: string | null;
			googleAuthors: string[];
			googleDescription: string | null;
			markdown: string | null;
			rating: number | null;
			tags: string[];
		}[]
	>;
};
