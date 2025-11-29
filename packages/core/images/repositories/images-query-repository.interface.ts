import type { Status, UserId } from "../../common/entities/common-entity";
import type { Path } from "../entities/image-entity";
import type { ImagesFindManyParams } from "../types/query-params";

export type IImagesQueryRepository = {
	findByPath(
		path: Path,
		userId: UserId,
	): Promise<{
		id: string;
		path: string;
		contentType: string;
		fileSize: number | null;
		width: number | null;
		height: number | null;
		tags: string[];
		status: string;
		description: string | null;
	} | null>;
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
	getFromStorageOrThrow(path: string, isThumbnail: boolean): Promise<void>;
};
