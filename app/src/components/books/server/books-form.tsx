import type { ServerAction } from "@/common/types";
import { BooksFormClient } from "../client/books-form-client";

type Props = {
	addBooks: (formData: FormData) => Promise<ServerAction>;
};

export async function BooksForm({ addBooks }: Props) {
	return <BooksFormClient addBooks={addBooks} />;
}
