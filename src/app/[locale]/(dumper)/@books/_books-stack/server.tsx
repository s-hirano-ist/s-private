import { forbidden } from "next/navigation";
import { ImageCardStack } from "@/components/card/image-card-stack";
import { Unexpected } from "@/components/status/unexpected";
import { getExportedBooks } from "@/features/books/actions/get-books";
import { hasViewerAdminPermission } from "@/utils/auth/session";

export async function BooksStack() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const data = await getExportedBooks();

		return <ImageCardStack basePath="book" data={data} />;
	} catch (error) {
		return <Unexpected caller="BooksStack" error={error} />;
	}
}
