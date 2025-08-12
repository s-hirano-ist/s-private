import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/status/status-code-view";
import { getContentsCount } from "@/features/contents/actions/get-contents";
import { loggerError } from "@/pino";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { ContentsCounterClient } from "./client";

export async function ContentsCounter() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const totalContents = await getContentsCount();

		return <ContentsCounterClient totalContents={totalContents} />;
	} catch (error) {
		loggerError("unexpected", { caller: "ContentsStack", status: 500 }, error);
		return <StatusCodeView statusCode="500" />;
	}
}
