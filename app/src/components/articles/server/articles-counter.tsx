import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	count: number;
};

export function ArticlesCounter({ count }: Props) {
	return <CounterBadge label="totalArticles" totalItems={count} />;
}
