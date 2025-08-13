import { forbidden } from "next/navigation";
import { Unexpected } from "@/components/status/unexpected";
import { addContents } from "@/features/contents/actions/add-contents";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { AddContentsFormClient } from "./client";

export async function AddContentsForm() {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		return <AddContentsFormClient addContents={addContents} />;
	} catch (error) {
		return <Unexpected caller="AddContentsForm" error={error} />;
	}
}
