import { Suspense } from "react";
import { addBooks } from "@/applications/books/add-books";
import { deleteBooks } from "@/applications/books/delete-books";
import {
	getBooksCount,
	getExportedBooks,
	getUnexportedBooks,
} from "@/applications/books/get-books";
import { BooksStack } from "@/components/books/server/book-stack";
import { BooksCounter } from "@/components/books/server/books-counter";
import { BooksForm } from "@/components/books/server/books-form";
import Loading from "@/components/common/loading";

type Params = Promise<{ page?: string; tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab, layout } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active
	if (tab && tab !== "books") return <div />;

	switch (layout) {
		case "viewer":
			return (
				<>
					<BooksCounter
						currentPage={currentPage}
						getBooksCount={getBooksCount}
					/>

					<Suspense fallback={<Loading />}>
						<BooksStack getBooks={getExportedBooks} />
					</Suspense>
				</>
			);
		case "dumper":
		default:
			return (
				<>
					<BooksForm addBooks={addBooks} />

					<Suspense fallback={<Loading />}>
						<BooksStack
							deleteBooks={deleteBooks}
							getBooks={getUnexportedBooks}
						/>
					</Suspense>
				</>
			);
	}
}
