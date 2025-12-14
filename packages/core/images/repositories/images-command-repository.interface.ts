import type { Status } from "../../common/entities/common-entity";
import type { Path, UnexportedImage } from "../entities/image-entity";

export type IImagesCommandRepository = {
	create(data: UnexportedImage): Promise<void>;
	uploadToStorage(
		path: Path,
		buffer: Buffer,
		isThumbnail: boolean,
	): Promise<void>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
};
