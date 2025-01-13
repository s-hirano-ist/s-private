import { Unauthorized } from "@/components/card/unauthorized";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import { ChangeStatusForm } from "@/features/dump/components/change-status-form";

export const dynamic = "force-dynamic";

export default async function Page() {
	await checkSelfAuthOrRedirectToAuth();

	const hasAdminPermission = await hasContentsPermission();

	return <>{hasAdminPermission ? <ChangeStatusForm /> : <Unauthorized />}</>;
}
