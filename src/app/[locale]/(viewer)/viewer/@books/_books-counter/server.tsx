import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/status/status-code-view";
import { getBooksCount } from "@/features/books/actions/get-books";
import { loggerError } from "@/pino";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { BooksCounterClient } from "./client";

export async function BooksCounter() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const totalContents = await getBooksCount();

		return <BooksCounterClient totalBooks={totalContents} />;
	} catch (error) {
		loggerError("unexpected", { caller: "BooksCounter", status: 500 }, error);
		return <StatusCodeView statusCode="500" />;
	}
}
