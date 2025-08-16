import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import { ServerAction } from "@/common/types";
import { Unexpected } from "@/components/common/display/status/unexpected";
import { LinkCardData } from "@/components/common/layouts/cards/link-card";
import { LinkCardStack } from "@/components/common/layouts/cards/link-card-stack";

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
