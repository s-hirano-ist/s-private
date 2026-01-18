import "server-only";

import {
	getExportedBooks,
	getUnexportedBooks,
} from "@/application-services/books/get-books";
import { BooksStack } from "@/components/books/server/books-stack";
import type { PaginatedImageCardLoaderProps } from "@/loaders/types";

export type BooksStackLoaderProps = PaginatedImageCardLoaderProps & {
	variant: "exported" | "unexported";
};

export async function BooksStackLoader({
	variant,
	deleteAction,
	loadMoreAction,
}: BooksStackLoaderProps) {
	const getData =
		variant === "exported" ? getExportedBooks : getUnexportedBooks;

	const initialData = await getData(0);

	return (
		<BooksStack
			deleteAction={deleteAction}
			initialData={initialData}
			loadMoreAction={loadMoreAction}
		/>
	);
}
