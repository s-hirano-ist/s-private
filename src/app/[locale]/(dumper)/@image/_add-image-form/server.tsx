import { AddImageFormClient } from "@/app/[locale]/(dumper)/@image/_add-image-form/client";
import { hasDumperPostPermission } from "@/features/auth/utils/session";

export async function AddImageForm() {
	const hasPostPermission = await hasDumperPostPermission();

	if (!hasPostPermission) return <></>;
	return <AddImageFormClient />;
}
