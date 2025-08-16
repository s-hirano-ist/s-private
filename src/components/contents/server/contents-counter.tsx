import { forbidden } from "next/navigation";
import { getContentsCount } from "@/applications/contents/get-contents";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { BadgeWithPagination } from "@/components/common/badge-with-pagination";
import { Unexpected } from "@/components/common/status/unexpected";

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
