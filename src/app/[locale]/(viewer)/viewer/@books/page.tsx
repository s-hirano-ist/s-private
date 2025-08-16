import { Suspense } from "react";
import { getExportedBooks } from "@/applications/books/get-books";
import { BooksStack } from "@/components/books/server/book-stack";
import { BooksCounter } from "@/components/books/server/books-counter";
import Loading from "@/components/common/loading";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;

	// Only render if this tab is active
	if (tab && tab !== "books") return <div />;

	return (
		<>
			<BooksCounter />

			<Suspense fallback={<Loading />}>
				<BooksStack getBooks={getExportedBooks} />
			</Suspense>
		</>
	);
}
