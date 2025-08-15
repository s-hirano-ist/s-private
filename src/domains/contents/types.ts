import { PrismaCacheStrategy } from "@prisma/extension-accelerate";
import type { Prisma, Status } from "@/generated";
import type {
	ContentsFormSchema,
	ContentsQueryData,
} from "./entities/contents-entity";

export type IContentsCommandRepository = {
	create(data: ContentsFormSchema): Promise<void>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};

export type IContentsQueryRepository = {
	findByTitle(title: string, userId: string): Promise<string | null>;
	findMany(
		userId: string,
		status: Status,
		params: ContentsFindManyParams,
	): Promise<ContentsQueryData[]>;
	count(userId: string, status: Status): Promise<number>;
};

export type ContentsFindManyParams = {
	orderBy?: Prisma.ContentsOrderByWithRelationInput;
	take?: number;
	skip?: number;
	cacheStrategy?: PrismaCacheStrategy["cacheStrategy"];
};
