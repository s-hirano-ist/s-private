import { Suspense } from "react";
import { addBooks } from "@/applications/books/add-books";
import { deleteBooks } from "@/applications/books/delete-books";
import { getUnexportedBooks } from "@/applications/books/get-books";
import Loading from "@/common/components/loading";
import { BooksStack } from "@/features/books/server/book-stack";
import { BooksForm } from "@/features/books/server/books-form";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;

	// Only render if this tab is active
	if (tab && tab !== "books") return <div />;

	return (
		<>
			<BooksForm addBooks={addBooks} />

			<Suspense fallback={<Loading />}>
				<BooksStack deleteBooks={deleteBooks} getBooks={getUnexportedBooks} />
			</Suspense>
		</>
	);
}
