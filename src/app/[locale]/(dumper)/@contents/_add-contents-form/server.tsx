import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/status/status-code-view";
import { addContents } from "@/features/contents/actions/add-contents";
import { loggerError } from "@/pino";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { AddContentsFormClient } from "./client";

export async function AddContentsForm() {
	const hasPostPermission = await hasDumperPostPermission();
	if (!hasPostPermission) forbidden();

	try {
		return <AddContentsFormClient addContents={addContents} />;
	} catch (error) {
		loggerError(
			"unexpected",
			{ caller: "AddContentsForm", status: 500 },
			error,
		);
		return <StatusCodeView statusCode="500" />;
	}
}
