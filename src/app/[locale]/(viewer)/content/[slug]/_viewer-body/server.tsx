import { forbidden } from "next/navigation";
import { ViewerBodyClient } from "@/components/body/viewer-body";
import { NotFound } from "@/components/status/not-found";
import { StatusCodeView } from "@/components/status/status-code-view";
import { getContentByTitle } from "@/features/contents/actions/get-contents";
import { hasViewerAdminPermission } from "@/utils/auth/session";

type Props = { slug: string };

export async function ViewerBody({ slug }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const decodedSlug = decodeURIComponent(slug);
		const data = await getContentByTitle(decodedSlug);
		if (!data) return <NotFound />;
		return <ViewerBodyClient markdown={data.markdown} />;
	} catch (error) {
		return <StatusCodeView statusCode="500" />;
	}
}
