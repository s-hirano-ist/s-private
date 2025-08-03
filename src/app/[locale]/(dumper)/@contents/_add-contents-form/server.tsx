import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { addContents } from "@/features/contents/actions/add-contents";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { AddContentsFormClient } from "./client";

export async function AddContentsForm() {
	const hasPostPermission = await hasDumperPostPermission();
	if (!hasPostPermission) forbidden();

	try {
		return <AddContentsFormClient addContents={addContents} />;
	} catch (error) {
		return <StatusCodeView statusCode="500" />;
	}
}
