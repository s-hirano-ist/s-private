import { StatusCodeView } from "@/components/card/status-code-view";
import { Unauthorized } from "@/components/card/unauthorized";
import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { addContents } from "@/features/contents/actions/add-contents";
import { loggerError } from "@/pino";
import { AddContentsFormClient } from "./client";

export async function AddContentsForm() {
	try {
		const hasPostPermission = await hasDumperPostPermission();
		if (!hasPostPermission) return <Unauthorized />;

		return <AddContentsFormClient addContents={addContents} />;
	} catch (error) {
		loggerError("unexpected", { caller: "AddNewsForm", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
