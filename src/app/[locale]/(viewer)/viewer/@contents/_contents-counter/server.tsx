import { forbidden } from "next/navigation";
import { CountBadge } from "@/components/count-badge";
import { Unexpected } from "@/components/status/unexpected";
import { getContentsCount } from "@/features/contents/actions/get-contents";
import { hasViewerAdminPermission } from "@/utils/auth/session";

export async function ContentsCounter() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const totalContents = await getContentsCount("EXPORTED");

		return <CountBadge label="totalContents" total={totalContents} />;
	} catch (error) {
		return <Unexpected caller="ContentsCounter" error={error} />;
	}
}
