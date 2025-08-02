import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getStaticContentsCount } from "@/features/viewer/actions/static-contents";
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
