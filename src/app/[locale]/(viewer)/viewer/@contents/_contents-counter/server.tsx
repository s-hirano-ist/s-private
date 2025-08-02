import { StatusCodeView } from "@/components/card/status-code-view";
import { Unauthorized } from "@/components/card/unauthorized";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getStaticContentsCount } from "@/features/viewer/actions/static-contents";
import { loggerError } from "@/pino";
import { ContentsCounterClient } from "./client";

export async function ContentsCounter() {
	try {
		const hasAdminPermission = await hasViewerAdminPermission();
		if (!hasAdminPermission) return <Unauthorized />;

		const totalContents = await getStaticContentsCount();

		return <ContentsCounterClient totalContents={totalContents} />;
	} catch (error) {
		loggerError(
			"unexpected",
			{
				caller: "ContentsCounter",
				status: 500,
			},
			error,
		);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
