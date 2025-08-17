import type { GetBooksCount } from "@/application-services/books/get-books";
import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	getBooksCount: GetBooksCount;
};

export async function BooksCounter({ getBooksCount }: Props) {
	const booksCount = await getBooksCount();

	return <CounterBadge label="totalBooks" totalItems={booksCount} />;
}
