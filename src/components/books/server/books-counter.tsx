import { forbidden } from "next/navigation";
import { getBooksCount } from "@/applications/books/get-books";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { BadgeWithPagination } from "@/components/common/badge-with-pagination";
import { Unexpected } from "@/components/common/status/unexpected";

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
