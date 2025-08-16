import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import { ServerAction } from "@/common/types";
import { Unexpected } from "@/components/common/status/unexpected";
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
