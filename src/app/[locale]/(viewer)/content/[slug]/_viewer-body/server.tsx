import { forbidden } from "next/navigation";
import { ViewerBodyClient } from "@/components/body/viewer-body";
import { NotFound } from "@/components/status/not-found";
import { StatusCodeView } from "@/components/status/status-code-view";
import { contentsQueryRepository } from "@/features/contents/repositories/contents-query-repository";
import { hasViewerAdminPermission } from "@/utils/auth/session";

type Props = { slug: string };

export async function ViewerBody({ slug }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const data = await contentsQueryRepository.findByTitle(slug);
		if (!data) return <NotFound />;
		return <ViewerBodyClient markdown={data.markdown} />;
	} catch (error) {
		return <StatusCodeView statusCode="500" />;
	}
}
