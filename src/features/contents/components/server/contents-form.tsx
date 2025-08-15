import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import { Unexpected } from "@/common/components/status/unexpected";
import { ServerAction } from "@/common/types";
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
