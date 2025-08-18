import type { GetCount } from "@/common/types";
import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	getNewsCount: GetCount;
};

export async function NewsCounter({ getNewsCount }: Props) {
	const newsCount = await getNewsCount();

	return <CounterBadge label="totalNews" totalItems={newsCount} />;
}
