import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import {
	type ImageData,
	ImageStack as ImageStackClient,
} from "@/common/components/image/image-stack";
import { Unexpected } from "@/common/components/status/unexpected";
import { ServerAction } from "@/common/types";

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
