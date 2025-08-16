import type { getImagesCount } from "@/application-services/images/get-images";
import { BadgeWithPagination } from "@/components/common/display/badge-with-pagination";

type Props = {
	currentPage: number;
	getImagesCount: typeof getImagesCount;
};

export async function ImagesCounter({ currentPage, getImagesCount }: Props) {
	const totalImages = await getImagesCount("EXPORTED");

	return (
		<BadgeWithPagination
			currentPage={currentPage}
			itemsPerPage={totalImages.pageSize}
			label="totalImages"
			totalItems={totalImages.count}
		/>
	);
}
