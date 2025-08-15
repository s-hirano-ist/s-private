import { PrismaCacheStrategy } from "@prisma/extension-accelerate";
import type { Prisma, Status } from "@/generated";
import { ImagesFormSchema, ImagesQueryData } from "./entities/images-entity";

export type IImagesCommandRepository = {
	create(data: ImagesFormSchema): Promise<void>;
	uploadToStorage(
		path: string,
		buffer: Buffer,
		isThumbnail: boolean,
	): Promise<void>;
};

export type ImagesFindManyParams = {
	orderBy?: Prisma.ImagesOrderByWithRelationInput;
	take?: number;
	skip?: number;
	cacheStrategy?: PrismaCacheStrategy["cacheStrategy"];
};

export type IImagesQueryRepository = {
	findMany(
		userId: string,
		status: Status,
		params?: ImagesFindManyParams,
	): Promise<ImagesQueryData[]>;
	count(userId: string, status: Status): Promise<number>;
	getFromStorage(
		path: string,
		isThumbnail: boolean,
	): Promise<NodeJS.ReadableStream>;
};
