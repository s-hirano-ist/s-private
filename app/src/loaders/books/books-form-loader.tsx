import "server-only";
import type { ServerAction } from "@/common/types";
import type { BaseLoaderProps } from "@/loaders/types";
import { BooksForm } from "@/components/books/client/books-form";

export type BooksFormLoaderProps = BaseLoaderProps & {
	addBooks: (formData: FormData) => Promise<ServerAction>;
};

export async function BooksFormLoader({ addBooks }: BooksFormLoaderProps) {
	return <BooksForm addBooks={addBooks} />;
}
