import { forbidden } from "next/navigation";
import { getContentByTitle } from "@/applications/contents/get-contents";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { ViewerBodyClient } from "@/components/common/body/viewer-body";
import { NotFound } from "@/components/common/status/not-found";
import { Unexpected } from "@/components/common/status/unexpected";

type Props = { slug: string };

export async function ViewerBody({ slug }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const decodedSlug = decodeURIComponent(slug);
		const markdown = await getContentByTitle(decodedSlug);
		if (!markdown) return <NotFound />;
		return <ViewerBodyClient markdown={markdown} />;
	} catch (error) {
		return <Unexpected caller="ViewerBody" error={error} />;
	}
}
