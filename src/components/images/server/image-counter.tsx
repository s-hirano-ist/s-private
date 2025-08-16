import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { BadgeWithPagination } from "@/components/common/badge-with-pagination";
import { Unexpected } from "@/components/common/status/unexpected";
import type { Status } from "@/domains/common/entities/common-entity";

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
				label="totalImages"
				totalItems={totalImages}
			/>
		);
	} catch (error) {
		return <Unexpected caller="ImageCounter" error={error} />;
	}
}
