import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { ServerAction } from "@/common/types";
import {
	type ImageData,
	ImageStack as ImageStackClient,
} from "@/components/common/image/image-stack";
import { Unexpected } from "@/components/common/status/unexpected";

type Props = {
	page: number;
	getImages: (page: number) => Promise<ImageData[]>;
	deleteImages?: (id: string) => Promise<ServerAction>;
};

export async function ImageStack({ page, getImages, deleteImages }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const images = await getImages(page);

		return (
			<ImageStackClient
				data={images}
				deleteAction={deleteImages}
				showDeleteButton={deleteImages !== undefined}
			/>
		);
	} catch (error) {
		return <Unexpected caller="ImageStack" error={error} />;
	}
}
