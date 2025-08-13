import { Unexpected } from "@/components/status/unexpected";
import { addImage } from "@/features/images/actions/add-image";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { AddImageFormClient } from "./client";

export async function AddImageForm() {
	try {
		const hasPostPermission = await hasDumperPostPermission();

		if (!hasPostPermission) return <></>;

		return <AddImageFormClient addImage={addImage} />;
	} catch (error) {
		return <Unexpected caller="AddImageForm" error={error} />;
	}
}
