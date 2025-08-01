import { Unauthorized } from "@/components/card/unauthorized";
import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { ChangeStatusFormClient } from "./client";

export async function ChangeStatusForm() {
	const hasAdminPermission = await hasDumperPostPermission();
	return (
		<>{hasAdminPermission ? <ChangeStatusFormClient /> : <Unauthorized />}</>
	);
}
