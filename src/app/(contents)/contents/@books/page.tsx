import { Badge } from "@/components/ui/badge";
import { Unauthorized } from "@/components/unauthorized";
import { checkAdminPermission } from "@/features/auth/utils/role";
import {
	getAllImages,
	getAllSlugs,
} from "@/features/contents/actions/fetch-contents";
import { ContentsStack } from "@/features/contents/components/contents-stack";
import { formatSlugsAndImages } from "@/features/contents/utils/format";

const path = "books";

export default async function Page() {
	const hasAdminPermission = await checkAdminPermission();

	const slugs = getAllSlugs(path);
	const images = getAllImages(path);

	return (
		<>
			{hasAdminPermission ? (
				<>
					<Badge className="m-2 flex justify-center">
						冊数: {slugs.length}
					</Badge>
					<ContentsStack
						path={path}
						data={formatSlugsAndImages(slugs, images)}
					/>
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
