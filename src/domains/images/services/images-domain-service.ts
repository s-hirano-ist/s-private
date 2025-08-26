import { DuplicateError, UnexpectedError } from "@/common/error/error-classes";
import {
	makeUserId,
	type UserId,
} from "@/domains/common/entities/common-entity";
import type { IImagesQueryRepository } from "@/domains/images/repositories/images-query-repository.interface";
import {
	type ContentType,
	type Description,
	type FileSize,
	imageEntity,
	makePath,
	type Path,
	type Pixel,
	type Tag,
	UnexportedImage,
} from "../entities/image-entity";

async function ensureNoDuplicateImage(
	imagesQueryRepository: IImagesQueryRepository,
	path: Path,
	userId: UserId,
): Promise<void> {
	const exists = await imagesQueryRepository.findByPath(path, userId);
	if (exists !== null) throw new DuplicateError();
}

type ImageStatus = "NEED_CREATE" | "NEED_UPDATE" | "NO_UPDATE";

async function changeImageStatus(
	imagesQueryRepository: IImagesQueryRepository,
	path: Path,
	userId: UserId,
	contentType: ContentType,
	fileSize: FileSize,
	width?: Pixel,
	height?: Pixel,
	tags?: Array<Tag>,
	description?: Description,
): Promise<{ status: ImageStatus; data: UnexportedImage }> {
	const data = await imagesQueryRepository.findByPath(
		makePath(path),
		makeUserId(userId),
	);
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

	if (
		data.contentType !== contentType ||
		data.fileSize !== fileSize ||
		data.width !== width ||
		data.height !== height ||
		JSON.stringify(data.tags) !== JSON.stringify(tags) ||
		data.description !== description
	) {
		return {
			status: "NEED_UPDATE",
			data: imageEntity.update(newData.data, {
				contentType,
				fileSize,
				width,
				height,
				tags,
				description,
			}),
		};
	}
	return { status: "NO_UPDATE", data: newData.data };
}

export class ImagesDomainService {
	constructor(private readonly imagesQueryRepository: IImagesQueryRepository) {}

	public async ensureNoDuplicate(path: Path, userId: UserId) {
		return ensureNoDuplicateImage(this.imagesQueryRepository, path, userId);
	}

	public async changeImageStatus(
		path: Path,
		userId: UserId,
		contentType: ContentType,
		fileSize: FileSize,
		width?: Pixel,
		height?: Pixel,
		tags?: Array<Tag>,
		description?: Description,
	) {
		return changeImageStatus(
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
