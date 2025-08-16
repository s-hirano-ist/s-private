import { ServerAction } from "@/common/types";
import {
	type ImageData,
	ImageStack as ImageStackClient,
} from "@/components/common/display/image/image-stack";

type Props = {
	currentPage: number;
	getImages: (page: number) => Promise<ImageData[]>;
	deleteImages?: (id: string) => Promise<ServerAction>;
};

export async function ImagesStack({
	currentPage,
	getImages,
	deleteImages,
}: Props) {
	const images = await getImages(currentPage);

	return (
		<ImageStackClient
			data={images}
			deleteAction={deleteImages}
			showDeleteButton={deleteImages !== undefined}
		/>
	);
}
