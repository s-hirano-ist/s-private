import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { BadgeWithPagination } from "@/common/components/badge-with-pagination";
import { Unexpected } from "@/common/components/status/unexpected";
import { getBooksCount } from "@/features/books/actions/get-books";

export async function BooksCounter() {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const totalBooks = await getBooksCount("EXPORTED");
		return (
			<BadgeWithPagination
				currentPage={1}
				label="totalBooks"
				totalItems={totalBooks}
			/>
		);
	} catch (error) {
		return <Unexpected caller="BooksCounter" error={error} />;
	}
}
