import type { GetCount } from "@/common/types";
import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	getContentsCount: GetCount;
};

export async function ContentsCounter({ getContentsCount }: Props) {
	const totalContents = await getContentsCount();

	return <CounterBadge label="totalContents" totalItems={totalContents} />;
}
