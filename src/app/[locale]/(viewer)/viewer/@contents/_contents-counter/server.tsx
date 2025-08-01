import { Unauthorized } from "@/components/card/unauthorized";
import { CountBadge } from "@/components/count-badge";
import { PreviewStackClient } from "@/components/stack/preview-stack";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getStaticContentsCount } from "@/features/viewer/actions/static-contents";

export async function ContentsCounter() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) return <Unauthorized />;

	const totalImages = await getStaticContentsCount();

	return <CountBadge label="totalContents" total={totalImages} />;
}
