import { forbidden } from "next/navigation";
import { getContentsCount } from "@/applications/contents/get-contents";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { BadgeWithPagination } from "@/components/common/badge-with-pagination";
import { Unexpected } from "@/components/common/status/unexpected";

type Props = {
	currentPage: number;
	getContentsCount: typeof getContentsCount;
};

export async function ContentsCounter({
	currentPage,
	getContentsCount,
}: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const totalContents = await getContentsCount("EXPORTED");

		return (
			<BadgeWithPagination
				currentPage={currentPage}
				itemsPerPage={totalContents.pageSize}
				label="totalContents"
				totalItems={totalContents.count}
			/>
		);
	} catch (error) {
		return <Unexpected caller="ContentsCounter" error={error} />;
	}
}
