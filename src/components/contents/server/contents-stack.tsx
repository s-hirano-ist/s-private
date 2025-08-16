import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import { ServerAction } from "@/common/types";
import { LinkCardData } from "@/components/common/card/link-card";
import { LinkCardStack } from "@/components/common/card/link-card-stack";
import { Unexpected } from "@/components/common/status/unexpected";

type Props = {
	page: number;
	getContents: (page: number) => Promise<LinkCardData[]>;
	deleteContents?: (id: string) => Promise<ServerAction>;
};

export async function ContentsStack({
	page,
	getContents,
	deleteContents,
}: Props) {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const data = await getContents(page);

		return (
			<LinkCardStack
				data={data}
				deleteAction={deleteContents}
				showDeleteButton={deleteContents !== undefined}
			/>
		);
	} catch (error) {
		return <Unexpected caller="ContentsStack" error={error} />;
	}
}
