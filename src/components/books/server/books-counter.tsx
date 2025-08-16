import type { getBooksCount } from "@/application-services/books/get-books";
import { BadgeWithPagination } from "@/components/common/display/badge-with-pagination";

type Props = {
	currentPage: number;
	getBooksCount: typeof getBooksCount;
};

export async function BooksCounter({ currentPage, getBooksCount }: Props) {
	const totalBooks = await getBooksCount("EXPORTED");

	return (
		<BadgeWithPagination
			currentPage={currentPage}
			itemsPerPage={totalBooks.pageSize}
			label="totalBooks"
			totalItems={totalBooks.count}
		/>
	);
}
