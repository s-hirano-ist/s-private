import { Badge } from "@/components/ui/badge";
import { Unauthorized } from "@/components/unauthorized";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import {
	getAllImages,
	getAllSlugs,
} from "@/features/viewer/actions/fetch-for-viewer";
import { ViewerStack } from "@/features/viewer/components/viewer-stack";
import { formatSlugsAndImages } from "@/features/viewer/utils/format";

const path = "books";

export default async function Page() {
	await checkSelfAuthOrRedirectToAuth();

	const hasAdminPermission = await hasContentsPermission();

	const slugs = getAllSlugs(path);
	const images = getAllImages(path);

	return (
		<>
			{hasAdminPermission ? (
				<>
					<Badge className="m-2 flex justify-center">
						冊数: {slugs.length}
					</Badge>
					<ViewerStack path={path} data={formatSlugsAndImages(slugs, images)} />
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
