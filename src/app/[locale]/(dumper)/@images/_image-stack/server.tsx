import { ImageStack as ImageStackClient } from "@/components/image/image-stack";
import { Unexpected } from "@/components/status/unexpected";
import { getUnexportedImages } from "@/features/images/actions/get-images";

export async function ImageStack() {
	try {
		const images = await getUnexportedImages();

		return <ImageStackClient data={images} />;
	} catch (error) {
		return <Unexpected caller="ImageStack" error={error} />;
	}
}
