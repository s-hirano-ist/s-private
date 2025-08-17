import type { GetNewsCount } from "@/application-services/news/get-news";
import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	getNewsCount: GetNewsCount;
};

export async function NewsCounter({ getNewsCount }: Props) {
	const newsCount = await getNewsCount();

	return <CounterBadge label="totalNews" totalItems={newsCount} />;
}
