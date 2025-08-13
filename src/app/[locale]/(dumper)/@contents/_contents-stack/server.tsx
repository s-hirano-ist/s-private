import { forbidden } from "next/navigation";
import { LinkCardStack } from "@/components/card/link-card-stack";
import { Unexpected } from "@/components/status/unexpected";
import { getUnexportedContents } from "@/features/contents/actions/get-contents";
import { hasDumperPostPermission } from "@/utils/auth/session";

export async function ContentsStack() {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const unexportedContents = await getUnexportedContents();

		return <LinkCardStack data={unexportedContents} showDeleteButton={false} />;
	} catch (error) {
		return <Unexpected caller="ContentsStack" error={error} />;
	}
}
