import { Suspense } from "react";
import Loading from "@/common/components/loading";
import { addBooks } from "@/features/books/actions/add-books";
import { getUnexportedBooks } from "@/features/books/actions/get-books";
import { BooksStack } from "@/features/books/components/server/book-stack";
import { BooksForm } from "@/features/books/components/server/books-form";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;

	// Only render if this tab is active
	if (tab && tab !== "books") return <div />;

	return (
		<>
			<BooksForm addBooks={addBooks} />

			<Suspense fallback={<Loading />}>
				<BooksStack getBooks={getUnexportedBooks} />
			</Suspense>
		</>
	);
}
