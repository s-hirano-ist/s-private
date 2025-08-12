import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/status/status-code-view";
import { getAllContents } from "@/features/contents/actions/get-contents";
import { loggerError } from "@/pino";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { ContentsStackClient } from "./client";

export async function ContentsStack() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const data = await getAllContents();

		return <ContentsStackClient data={data} />;
	} catch (error) {
		loggerError("unexpected", { caller: "ContentsStack", status: 500 }, error);
		return <StatusCodeView statusCode="500" />;
	}
}
