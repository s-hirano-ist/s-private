import { forbidden } from "next/navigation";
import type { getImagesCount } from "@/application-services/images/get-images";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { BadgeWithPagination } from "@/components/common/display/badge-with-pagination";
import { Unexpected } from "@/components/common/display/status/unexpected";

type Props = {
	currentPage: number;
	getImagesCount: typeof getImagesCount;
};

export async function ImageCounter({ currentPage, getImagesCount }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) return forbidden();

	try {
		const totalImages = await getImagesCount("EXPORTED");

		return (
			<BadgeWithPagination
				currentPage={currentPage}
				itemsPerPage={totalImages.pageSize}
				label="totalImages"
				totalItems={totalImages.count}
			/>
		);
	} catch (error) {
		return <Unexpected caller="ImageCounter" error={error} />;
	}
}
