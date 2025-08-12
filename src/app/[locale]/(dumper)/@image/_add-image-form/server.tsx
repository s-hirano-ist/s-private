import { StatusCodeView } from "@/components/status/status-code-view";
import { addImage } from "@/features/images/actions/add-image";
import { loggerError } from "@/pino";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { AddImageFormClient } from "./client";

export async function AddImageForm() {
	try {
		const hasPostPermission = await hasDumperPostPermission();

		if (!hasPostPermission) return <></>;

		return <AddImageFormClient addImage={addImage} />;
	} catch (error) {
		loggerError("unexpected", { caller: "AddImageForm", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
