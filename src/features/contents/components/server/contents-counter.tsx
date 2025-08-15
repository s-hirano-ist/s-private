import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { BadgeWithPagination } from "@/common/components/badge-with-pagination";
import { Unexpected } from "@/common/components/status/unexpected";
import { getContentsCount } from "@/features/contents/actions/get-contents";

export async function ContentsCounter() {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const totalContents = await getContentsCount("EXPORTED");

		return (
			<BadgeWithPagination
				badgeOnly
				currentPage={1}
				label="totalContents"
				totalItems={totalContents}
			/>
		);
	} catch (error) {
		return <Unexpected caller="ContentsCounter" error={error} />;
	}
}
