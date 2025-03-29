import { Unauthorized } from "@/components/card/unauthorized";
import { CountBadge } from "@/components/count-badge";
import { ViewerStack } from "@/components/stack/viewer-stack";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import {
	getAllStaticContents,
	getStaticContentsCount,
} from "@/features/viewer/actions/static-contents";

const path = "contents";

export async function SuspensePage() {
	const hasAdminPermission = await hasViewerAdminPermission();

	const totalImages = await getStaticContentsCount();

	const images = await getAllStaticContents();

	return (
		<>
			{hasAdminPermission ? (
				<>
					<CountBadge label="totalContents" total={totalImages} />
					<ViewerStack imageType="svg" images={images} path={path} />
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
