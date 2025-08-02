import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { changeContentsStatus } from "@/features/contents/actions/change-contents-status";
import { changeImagesStatus } from "@/features/image/actions/change-images-status";
import { changeNewsStatus } from "@/features/news/actions/change-news-status";
import { ChangeStatusFormClient } from "./client";

export async function ChangeStatusForm() {
	const hasAdminPermission = await hasDumperPostPermission();
	if (!hasAdminPermission) forbidden();

	return (
		<ChangeStatusFormClient
			changeContentsStatus={changeContentsStatus}
			changeImagesStatus={changeImagesStatus}
			changeNewsStatus={changeNewsStatus}
		/>
	);
}
