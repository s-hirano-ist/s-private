import { forbidden } from "next/navigation";
import {
	type ImageData,
	ImageStack as ImageStackClient,
} from "@/components/image/image-stack";
import { Unexpected } from "@/components/status/unexpected";
import { hasViewerAdminPermission } from "@/utils/auth/session";

type Props = {
	page: number;
	getImages: (page: number) => Promise<ImageData[]>;
};

export async function ImageStack({ page, getImages }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const images = await getImages(page);

		return <ImageStackClient data={images} />;
	} catch (error) {
		return <Unexpected caller="ImageStack" error={error} />;
	}
}
