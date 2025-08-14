import { forbidden } from "next/navigation";
import { Unexpected } from "@/components/status/unexpected";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { ServerAction } from "@/utils/types";
import { BooksFormClient } from "../client/books-form-client";

type Props = {
	addBooks: (formData: FormData) => Promise<ServerAction>;
};

export async function BooksForm({ addBooks }: Props) {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) return forbidden();

	try {
		return <BooksFormClient addBooks={addBooks} />;
	} catch (error) {
		return <Unexpected caller="BooksForm" error={error} />;
	}
}
