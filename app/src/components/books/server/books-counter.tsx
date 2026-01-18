import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	count: number;
};

export function BooksCounter({ count }: Props) {
	return <CounterBadge label="totalBooks" totalItems={count} />;
}
