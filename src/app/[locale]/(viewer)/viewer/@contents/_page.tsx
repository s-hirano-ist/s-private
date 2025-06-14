import { Unauthorized } from "@/components/card/unauthorized";
import { CountBadge } from "@/components/count-badge";
import { PreviewStack } from "@/components/stack/preview-stack";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import {
	getAllStaticContents,
	getStaticContentsCount,
} from "@/features/viewer/actions/static-contents";

const basePath = "contents";

export async function SuspensePage() {
	const hasAdminPermission = await hasViewerAdminPermission();

	const totalImages = await getStaticContentsCount();

	const previewCardData = await getAllStaticContents();

	return (
		<>
			{hasAdminPermission ? (
				<>
					<CountBadge label="totalContents" total={totalImages} />
					<PreviewStack
						basePath={basePath}
						imageType="svg"
						previewCardData={previewCardData}
					/>
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
