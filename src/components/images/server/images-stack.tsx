import { ServerAction } from "@/common/types";
import {
	type ImageData,
	ImageStack as ImageStackClient,
} from "@/components/common/display/image/image-stack";

type Props = {
	page: number;
	getImages: (page: number) => Promise<ImageData[]>;
	deleteImages?: (id: string) => Promise<ServerAction>;
};

export async function ImagesStack({ page, getImages, deleteImages }: Props) {
	const images = await getImages(page);

	return (
		<ImageStackClient
			data={images}
			deleteAction={deleteImages}
			showDeleteButton={deleteImages !== undefined}
		/>
	);
}
