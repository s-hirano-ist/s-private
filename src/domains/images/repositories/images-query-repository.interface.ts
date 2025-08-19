import type { Status, UserId } from "@/domains/common/entities/common-entity";
import type { Path } from "../entities/image-entity";
import type { ImagesFindManyParams } from "../types/query-params";

export type IImagesQueryRepository = {
	findByPath(path: Path, userId: UserId): Promise<{} | null>;
	findMany(
		userId: UserId,
		status: Status,
		params?: ImagesFindManyParams,
	): Promise<
		{ id: string; path: string; height: number | null; width: number | null }[]
	>;
	count(userId: UserId, status: Status): Promise<number>;
	getFromStorage(
		path: string,
		isThumbnail: boolean,
	): Promise<NodeJS.ReadableStream>;
};
