import { forbidden } from "next/navigation";
import { ImageStack as ImageStackClient } from "@/components/image/image-stack";
import { Unexpected } from "@/components/status/unexpected";
import { getExportedImages } from "@/features/images/actions/get-images";
import { hasViewerAdminPermission } from "@/utils/auth/session";

type Props = { page: number };

export async function ImageStack({ page }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const images = await getExportedImages(page);

		return <ImageStackClient data={images} />;
	} catch (error) {
		return <Unexpected caller="ImageStack" error={error} />;
	}
}
