import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { AddContentsFormClient } from "./client";

export async function AddContentsForm() {
	const hasPostPermission = await hasDumperPostPermission();
	if (hasPostPermission) return <AddContentsFormClient />;
	return <></>;
}
