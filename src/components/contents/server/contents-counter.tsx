import { GetContentsCount } from "@/application-services/contents/get-contents";
import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	getContentsCount: GetContentsCount;
};

export async function ContentsCounter({ getContentsCount }: Props) {
	const totalContents = await getContentsCount();

	return <CounterBadge label="totalContents" totalItems={totalContents} />;
}
