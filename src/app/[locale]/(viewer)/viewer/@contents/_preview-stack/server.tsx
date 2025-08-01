import { Unauthorized } from "@/components/card/unauthorized";
import { PreviewStackClient } from "@/components/stack/preview-stack";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getAllStaticContents } from "@/features/viewer/actions/static-contents";

const basePath = "contents";

export async function PreviewStack() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) return <Unauthorized />;

	const previewCardData = await getAllStaticContents();

	return (
		<PreviewStackClient
			basePath={basePath}
			imageType="svg"
			previewCardData={previewCardData}
		/>
	);
}
