import "server-only";
import type { CounterLoaderProps } from "@/loaders/types";
import { getExportedBooksCount } from "@/application-services/books/get-books";
import { BooksCounter } from "@/components/books/server/books-counter";

export type BooksCounterLoaderProps = CounterLoaderProps;

export async function BooksCounterLoader(_props: BooksCounterLoaderProps) {
	const count = await getExportedBooksCount();

	return <BooksCounter count={count} />;
}
