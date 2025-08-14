import { forbidden } from "next/navigation";
import { Unexpected } from "@/components/status/unexpected";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { ServerAction } from "@/utils/types";
import { ContentsFormClient } from "../client/contents-form-client";

type Props = {
	addContents: (formData: FormData) => Promise<ServerAction>;
};

export async function ContentsForm({ addContents }: Props) {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		return <ContentsFormClient addContents={addContents} />;
	} catch (error) {
		return <Unexpected caller="ContentsForm" error={error} />;
	}
}
