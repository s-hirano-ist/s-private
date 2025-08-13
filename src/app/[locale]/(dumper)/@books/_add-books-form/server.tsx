import { Unexpected } from "@/components/status/unexpected";
import { addBooks } from "@/features/books/actions/add-books";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { AddBooksFormClient } from "./client";

export async function AddBooksForm() {
	try {
		const hasPermission = await hasDumperPostPermission();

		if (!hasPermission) return <></>;

		return <AddBooksFormClient addBooks={addBooks} />;
	} catch (error) {
		return <Unexpected caller="AddBooksForm" error={error} />;
	}
}
