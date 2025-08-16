import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import { ServerAction } from "@/common/types";
import { Unexpected } from "@/components/common/display/status/unexpected";
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
