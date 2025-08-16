import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import { LinkCardData } from "@/common/components/card/link-card";
import { LinkCardStack } from "@/common/components/card/link-card-stack";
import { Unexpected } from "@/common/components/status/unexpected";
import { ServerAction } from "@/common/types";

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
