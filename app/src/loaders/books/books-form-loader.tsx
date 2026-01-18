import "server-only";

import type { ServerAction } from "@/common/types";
import { BooksForm } from "@/components/books/client/books-form";
import type { BaseLoaderProps } from "@/loaders/types";

export type BooksFormLoaderProps = BaseLoaderProps & {
	addBooks: (formData: FormData) => Promise<ServerAction>;
};

export async function BooksFormLoader({ addBooks }: BooksFormLoaderProps) {
	return <BooksForm addBooks={addBooks} />;
}
