import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { getAllStaticContents } from "@/features/viewer/actions/static-contents";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { ContentsStackClient } from "./client";

export async function ContentsStack() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const previewCardData = await getAllStaticContents();

		return <ContentsStackClient previewCardData={previewCardData} />;
	} catch (error) {
		return <StatusCodeView statusCode="500" />;
	}
}
