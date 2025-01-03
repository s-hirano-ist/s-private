import { Unauthorized } from "@/components/unauthorized";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import { ChangeStatusButtons } from "@/features/dump/components/change-status-buttons";

export default async function Page() {
	await checkSelfAuthOrRedirectToAuth();

	const hasAdminPermission = await hasContentsPermission();

	return <>{hasAdminPermission ? <ChangeStatusButtons /> : <Unauthorized />}</>;
}
