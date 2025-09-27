import type { ServerAction } from "@/common/types";
import {
	type ImageData,
	ImageStack as ImageStackClient,
} from "@/components/common/display/image/image-stack";

type Props = {
	currentPage: number;
	getImages: (page: number) => Promise<ImageData[]>;
	deleteImage?: (id: string) => Promise<ServerAction>;
};

export async function ImagesStack({
	currentPage,
	getImages,
	deleteImage,
}: Props) {
	const images = await getImages(currentPage);

	return (
		<ImageStackClient
			data={images}
			deleteAction={deleteImage}
			showDeleteButton={deleteImage !== undefined}
		/>
	);
}
