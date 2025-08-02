import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getAllStaticContents } from "@/features/viewer/actions/static-contents";
import { ContentsStackClient } from "./client";

export async function ContentsStack() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	const previewCardData = await getAllStaticContents();

	return <ContentsStackClient previewCardData={previewCardData} />;
}
