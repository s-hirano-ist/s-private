import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import { LinkCardData } from "@/common/components/card/link-card";
import { LinkCardStack } from "@/common/components/card/link-card-stack";
import { Unexpected } from "@/common/components/status/unexpected";

type Props = {
	page: number;
	getContents: (page: number) => Promise<LinkCardData[]>;
};

export async function ContentsStack({ page, getContents }: Props) {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const data = await getContents(page);

		return <LinkCardStack data={data} showDeleteButton={false} />;
	} catch (error) {
		return <Unexpected caller="ContentsStack" error={error} />;
	}
}
