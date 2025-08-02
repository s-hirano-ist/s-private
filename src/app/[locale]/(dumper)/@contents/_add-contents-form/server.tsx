import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { addContents } from "@/features/contents/actions/add-contents";
import { AddContentsFormClient } from "./client";

export async function AddContentsForm() {
	const hasPostPermission = await hasDumperPostPermission();
	if (!hasPostPermission) forbidden();

	return <AddContentsFormClient addContents={addContents} />;
}
