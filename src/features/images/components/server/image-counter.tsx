import { forbidden } from "next/navigation";
import { BadgeWithPagination } from "@/components/badge-with-pagination";
import { Unexpected } from "@/components/status/unexpected";
import { PAGE_SIZE } from "@/constants";
import type { Status } from "@/domains/common/types";
import { hasViewerAdminPermission } from "@/utils/auth/session";

type Props = {
	page: number;
	getImagesCount: (status: Status) => Promise<number>;
};

export async function ImageCounter({ page, getImagesCount }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) return forbidden();

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
