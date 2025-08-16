import { getContentsCount } from "@/application-services/contents/get-contents";
import { BadgeWithPagination } from "@/components/common/display/badge-with-pagination";

type Props = {
	currentPage: number;
	getContentsCount: typeof getContentsCount;
};

export async function ContentsCounter({
	currentPage,
	getContentsCount,
}: Props) {
	const totalContents = await getContentsCount("EXPORTED");

	return (
		<BadgeWithPagination
			currentPage={currentPage}
			itemsPerPage={totalContents.pageSize}
			label="totalContents"
			totalItems={totalContents.count}
		/>
	);
}
