import "server-only";
import type { CounterLoaderProps } from "@/loaders/types";
import { getExportedBooksCount } from "@/application-services/books/get-books";
import { ViewerCountSync } from "@/components/common/layouts/nav/viewer-count-context";

export type BooksCounterLoaderProps = CounterLoaderProps;

export async function BooksCounterLoader(_props: BooksCounterLoaderProps) {
	const count = await getExportedBooksCount();

	return <ViewerCountSync count={count} domain="books" />;
}
