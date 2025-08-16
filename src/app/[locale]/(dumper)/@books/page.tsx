import { Suspense } from "react";
import { addBooks } from "@/applications/books/add-books";
import { deleteBooks } from "@/applications/books/delete-books";
import { getUnexportedBooks } from "@/applications/books/get-books";
import { BooksStack } from "@/components/books/server/book-stack";
import { BooksForm } from "@/components/books/server/books-form";
import Loading from "@/components/common/loading";

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
