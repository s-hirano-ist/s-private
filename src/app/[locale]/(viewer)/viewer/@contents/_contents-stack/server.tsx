import { StatusCodeView } from "@/components/card/status-code-view";
import { Unauthorized } from "@/components/card/unauthorized";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getAllStaticContents } from "@/features/viewer/actions/static-contents";
import { loggerError } from "@/pino";
import { ContentsStackClient } from "./client";

export async function ContentsStack() {
	try {
		const hasAdminPermission = await hasViewerAdminPermission();
		if (!hasAdminPermission) return <Unauthorized />;

		const previewCardData = await getAllStaticContents();

		return <ContentsStackClient previewCardData={previewCardData} />;
	} catch (error) {
		loggerError("unexpected", { caller: "ContentsStack", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
