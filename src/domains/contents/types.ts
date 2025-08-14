import { PrismaCacheStrategy } from "@prisma/extension-accelerate";
import type { Prisma, Status } from "@/generated";

export type IContentsQueryRepository = {
	findByTitle(title: string, userId: string): Promise<Contents | null>;
	findMany(
		userId: string,
		status: Status,
		params?: ContentsFindManyParams,
	): Promise<ContentsList>;
	count(userId: string, status: Status): Promise<number>;
};

export type Contents = {
	id: string;
	title: string;
	markdown: string;
};

export type ContentsList = {
	id: string;
	title: string;
}[];

export type ContentsFindManyParams = {
	orderBy?: Prisma.ContentsOrderByWithRelationInput;
	take?: number;
	skip?: number;
	cacheStrategy?: PrismaCacheStrategy["cacheStrategy"];
};

export type IContentsCommandRepository = {
	create(data: ContentsCreateInput): Promise<void>;
};

export type ContentsCreateInput = {
	title: string;
	markdown: string;
	userId: string;
};
