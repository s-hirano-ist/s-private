import type { getBooksCount } from "@/application-services/books/get-books";
import { CounterBadge } from "@/components/common/display/counter-badge";

type Props = {
	currentPage: number;
	getBooksCount: typeof getBooksCount;
};

export async function BooksCounter({ currentPage, getBooksCount }: Props) {
	const totalBooks = await getBooksCount("EXPORTED");

	return <CounterBadge label="totalBooks" totalItems={totalBooks.count} />;
}
