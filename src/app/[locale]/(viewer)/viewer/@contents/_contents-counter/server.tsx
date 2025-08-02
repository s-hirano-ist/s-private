import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getStaticContentsCount } from "@/features/viewer/actions/static-contents";
import { ContentsCounterClient } from "./client";

export async function ContentsCounter() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	const totalContents = await getStaticContentsCount();

	return <ContentsCounterClient totalContents={totalContents} />;
}
