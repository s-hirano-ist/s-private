import { forbidden } from "next/navigation";
import { BadgeWithPagination } from "@/components/badge-with-pagination";
import { Unexpected } from "@/components/status/unexpected";
import { getContentsCount } from "@/features/contents/actions/get-contents";
import { hasViewerAdminPermission } from "@/utils/auth/session";

export async function ContentsCounter() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

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
