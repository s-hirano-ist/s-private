import type { GetCount } from "@/common/types";
import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	getBooksCount: GetCount;
};

export async function BooksCounter({ getBooksCount }: Props) {
	const booksCount = await getBooksCount();

	return <CounterBadge label="totalBooks" totalItems={booksCount} />;
}
