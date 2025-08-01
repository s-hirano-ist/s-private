import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { AddImageFormClient } from "./client";

export async function AddImageForm() {
	const hasPostPermission = await hasDumperPostPermission();

	if (!hasPostPermission) return <></>;
	return <AddImageFormClient />;
}
