import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { getStaticContentsCount } from "@/features/contents/actions/static-contents";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { ContentsCounterClient } from "./client";

export async function ContentsCounter() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const totalContents = await getStaticContentsCount();

		return <ContentsCounterClient totalContents={totalContents} />;
	} catch (error) {
		return <StatusCodeView statusCode="500" />;
	}
}
