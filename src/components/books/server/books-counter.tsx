import { forbidden } from "next/navigation";
import type { getBooksCount } from "@/applications/books/get-books";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { BadgeWithPagination } from "@/components/common/badge-with-pagination";
import { Unexpected } from "@/components/common/status/unexpected";

type Props = {
	currentPage: number;
	getBooksCount: typeof getBooksCount;
};

export async function BooksCounter({ currentPage, getBooksCount }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const totalBooks = await getBooksCount("EXPORTED");

		return (
			<BadgeWithPagination
				currentPage={currentPage}
				itemsPerPage={totalBooks.pageSize}
				label="totalBooks"
				totalItems={totalBooks.count}
			/>
		);
	} catch (error) {
		return <Unexpected caller="BooksCounter" error={error} />;
	}
}
