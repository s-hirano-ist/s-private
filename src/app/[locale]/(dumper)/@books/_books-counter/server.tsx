import { forbidden } from "next/navigation";
import { CountBadge } from "@/components/count-badge";
import { Unexpected } from "@/components/status/unexpected";
import { getBooksCount } from "@/features/books/actions/get-books";
import { hasViewerAdminPermission } from "@/utils/auth/session";

export async function BooksCounter() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const totalContents = await getBooksCount("EXPORTED");

		return <CountBadge label="totalBooks" total={totalContents} />;
	} catch (error) {
		return <Unexpected caller="BooksCounter" error={error} />;
	}
}
