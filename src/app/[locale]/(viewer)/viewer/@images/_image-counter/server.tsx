import { forbidden } from "next/navigation";
import { BadgeWithPagination } from "@/components/badge-with-pagination";
import { Unexpected } from "@/components/status/unexpected";
import { PAGE_SIZE } from "@/constants";
import { getImagesCount } from "@/features/images/actions/get-images";
import { hasViewerAdminPermission } from "@/utils/auth/session";

type Props = { page: number };

export async function ImageCounter({ page }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) return forbidden();

	try {
		const totalImages = await getImagesCount("EXPORTED");

		return (
			<BadgeWithPagination
				currentPage={page}
				itemsPerPage={PAGE_SIZE}
				label="totalImages"
				totalItems={totalImages}
			/>
		);
	} catch (error) {
		return <Unexpected caller="ImageCounter" error={error} />;
	}
}
