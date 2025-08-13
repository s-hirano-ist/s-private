import { LinkCardStack } from "@/components/card/link-card-stack";
import { Unexpected } from "@/components/status/unexpected";
import { getUnexportedContents } from "@/features/contents/actions/get-contents";

export async function ContentsStack() {
	try {
		const unexportedContents = await getUnexportedContents();

		return <LinkCardStack data={unexportedContents} showDeleteButton={false} />;
	} catch (error) {
		return <Unexpected caller="ContentsStack" error={error} />;
	}
}
