import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { changeContentsStatus } from "@/features/contents/actions/change-contents-status";
import { changeImagesStatus } from "@/features/images/actions/change-images-status";
import { changeNewsStatus } from "@/features/news/actions/change-news-status";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { ChangeStatusFormClient } from "./client";

export async function ChangeStatusForm() {
	const hasAdminPermission = await hasDumperPostPermission();
	if (!hasAdminPermission) forbidden();

	try {
		return (
			<ChangeStatusFormClient
				changeContentsStatus={changeContentsStatus}
				changeImagesStatus={changeImagesStatus}
				changeNewsStatus={changeNewsStatus}
			/>
		);
	} catch (error) {
		return <StatusCodeView statusCode="500" />;
	}
}
