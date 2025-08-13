import { forbidden } from "next/navigation";
import { ImageCardStack } from "@/components/card/image-card-stack";
import { Unexpected } from "@/components/status/unexpected";
import { getUnexportedBooks } from "@/features/books/actions/get-books";
import { hasDumperPostPermission } from "@/utils/auth/session";

export async function BooksStack() {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const data = await getUnexportedBooks();

		return <ImageCardStack basePath="book" data={data} />;
	} catch (error) {
		return <Unexpected caller="BooksStack" error={error} />;
	}
}
