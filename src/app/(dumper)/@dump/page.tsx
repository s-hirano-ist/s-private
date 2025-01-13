import { Unauthorized } from "@/components/card/unauthorized";
import { hasDumperPostPermission } from "@/features/auth/utils/role";
import { ChangeStatusForm } from "@/features/dump/components/change-status-form";

export const dynamic = "force-dynamic";

export default async function Page() {
	const hasAdminPermission = await hasDumperPostPermission();

	return <>{hasAdminPermission ? <ChangeStatusForm /> : <Unauthorized />}</>;
}
