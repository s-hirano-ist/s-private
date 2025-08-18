import type { Status } from "@/domains/common/entities/common-entity";
import type { Image, Path } from "../entities/images-entity";

export type IImagesCommandRepository = {
	create(data: Image): Promise<void>;
	uploadToStorage(
		path: Path,
		buffer: Buffer,
		isThumbnail: boolean,
	): Promise<void>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};
