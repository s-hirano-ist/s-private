import type { UserId } from "../../common/entities/common-entity";
import { DuplicateError, UnexpectedError } from "../../errors/error-classes";
import {
	type ContentType,
	type Description,
	type FileSize,
	imageEntity,
	type Path,
	type Pixel,
	type Tag,
	UnexportedImage,
} from "../entities/image-entity";
import type { IImagesQueryRepository } from "../repositories/images-query-repository.interface";

async function ensureNoDuplicateImage(
	imagesQueryRepository: IImagesQueryRepository,
	path: Path,
	userId: UserId,
): Promise<void> {
	const exists = await imagesQueryRepository.findByPath(path, userId);
	if (exists !== null) throw new DuplicateError();
}

type ReturnType =
	| { status: "NEED_CREATE"; data: UnexportedImage }
	| { status: "NO_UPDATE" };

async function updateImage(
	imagesQueryRepository: IImagesQueryRepository,
	path: Path,
	userId: UserId,
	contentType: ContentType,
	fileSize: FileSize,
	width?: Pixel,
	height?: Pixel,
	tags?: Array<Tag>,
	description?: Description,
): Promise<ReturnType> {
	const data = await imagesQueryRepository.findByPath(path, userId);

	if (!data) {
		return {
			status: "NEED_CREATE",
			data: imageEntity.create({
				userId,
				path,
				contentType,
				fileSize,
				width,
				height,
				tags,
				description,
			}),
		};
	}
	const newData = UnexportedImage.safeParse(data);
	if (!newData.success) throw new UnexpectedError();

	return { status: "NO_UPDATE" };
}

export class ImagesDomainService {
	constructor(private readonly imagesQueryRepository: IImagesQueryRepository) {}

	public async ensureNoDuplicate(path: Path, userId: UserId) {
		return ensureNoDuplicateImage(this.imagesQueryRepository, path, userId);
	}

	public async updateImage(
		path: Path,
		userId: UserId,
		contentType: ContentType,
		fileSize: FileSize,
		width?: Pixel,
		height?: Pixel,
		tags?: Array<Tag>,
		description?: Description,
	) {
		return updateImage(
			this.imagesQueryRepository,
			path,
			userId,
			contentType,
			fileSize,
			width,
			height,
			tags,
			description,
		);
	}
}
