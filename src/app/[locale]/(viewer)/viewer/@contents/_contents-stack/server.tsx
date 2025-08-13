import { forbidden } from "next/navigation";
import { LinkCardStack } from "@/components/card/link-card-stack";
import { Unexpected } from "@/components/status/unexpected";
import { getExportedContents } from "@/features/contents/actions/get-contents";
import { hasViewerAdminPermission } from "@/utils/auth/session";

export async function ContentsStack() {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const data = await getExportedContents();

		return <LinkCardStack data={data} showDeleteButton={false} />;
	} catch (error) {
		return <Unexpected caller="ContetentsStack" error={error} />;
	}
}
