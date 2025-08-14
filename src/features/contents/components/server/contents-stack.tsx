import { forbidden } from "next/navigation";
import { LinkCardData } from "@/components/card/link-card";
import { LinkCardStack } from "@/components/card/link-card-stack";
import { Unexpected } from "@/components/status/unexpected";
import { hasDumperPostPermission } from "@/utils/auth/session";

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
