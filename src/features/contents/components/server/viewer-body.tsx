import { forbidden } from "next/navigation";
import { ViewerBodyClient } from "@/components/body/viewer-body";
import { NotFound } from "@/components/status/not-found";
import { Unexpected } from "@/components/status/unexpected";
import { getContentByTitle } from "@/features/contents/actions/get-contents";
import { hasViewerAdminPermission } from "@/utils/auth/session";

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
