import type { UserId } from "@/domains/common/entities/common-entity";
import {
	imageEntity,
	makePath,
	type UnexportedImage,
} from "@/domains/images/entities/image-entity";

type ImagesExportRepository = {
	findUnexported(userId: UserId): Promise<
		Array<{ path: string; userId: string }>
	>;
	markAsExported(path: string, userId: UserId): Promise<void>;
};

export class ImagesExportService {
	constructor(
		private readonly imagesExportRepository: ImagesExportRepository,
	) {}

	public async exportUnexportedImages(userId: UserId) {
		const unexportedImages = await this.imagesExportRepository.findUnexported(
			userId,
		);

		const exportResults = await Promise.all(
			unexportedImages.map(async (image) => {
				const imagePath = makePath(image.path, false);

				const unexportedImage: UnexportedImage = {
					id: "",
					userId,
					path: imagePath,
					contentType: "" as any,
					fileSize: 0 as any,
					width: 0 as any,
					height: 0 as any,
					tags: "",
					status: "UNEXPORTED",
					createdAt: "",
				};

				const exportedImage = imageEntity.export(unexportedImage);

				await this.imagesExportRepository.markAsExported(imagePath, userId);

				return exportedImage;
			}),
		);

		return exportResults;
	}
}