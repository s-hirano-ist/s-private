import { StatusCodeView } from "@/components/card/status-code-view";
import { Unauthorized } from "@/components/card/unauthorized";
import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { changeContentsStatus } from "@/features/contents/actions/change-contents-status";
import { changeImagesStatus } from "@/features/image/actions/change-images-status";
import { changeNewsStatus } from "@/features/news/actions/change-news-status";
import { loggerError } from "@/pino";
import { ChangeStatusFormClient } from "./client";

export async function ChangeStatusForm() {
	try {
		const hasAdminPermission = await hasDumperPostPermission();
		if (!hasAdminPermission) return <Unauthorized />;

		return (
			<ChangeStatusFormClient
				changeContentsStatus={changeContentsStatus}
				changeImagesStatus={changeImagesStatus}
				changeNewsStatus={changeNewsStatus}
			/>
		);
	} catch (error) {
		loggerError(
			"unexpected",
			{ caller: "ChangeStatusForm", status: 500 },
			error,
		);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
