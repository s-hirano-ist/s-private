import "server-only";

import type { ServerAction } from "@/common/types";
import { BooksFormClient } from "@/components/books/client/books-form-client";
import type { BaseLoaderProps } from "@/loaders/types";

export type BooksFormLoaderProps = BaseLoaderProps & {
	addBooks: (formData: FormData) => Promise<ServerAction>;
};

export async function BooksFormLoader({ addBooks }: BooksFormLoaderProps) {
	return <BooksFormClient addBooks={addBooks} />;
}
