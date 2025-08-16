import { forbidden } from "next/navigation";
import type { getContentByTitle } from "@/application-services/contents/get-contents";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { NotFound } from "@/components/common/display/status/not-found";
import { Unexpected } from "@/components/common/display/status/unexpected";
import { ViewerBodyClient } from "@/components/common/layouts/body/viewer-body";

type Props = { slug: string; getContentByTitle: typeof getContentByTitle };

export async function ViewerBody({ slug, getContentByTitle }: Props) {
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
