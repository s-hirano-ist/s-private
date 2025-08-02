import { StatusCodeView } from "@/components/card/status-code-view";
import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { addImage } from "@/features/image/actions/add-image";
import { loggerError } from "@/pino";
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
