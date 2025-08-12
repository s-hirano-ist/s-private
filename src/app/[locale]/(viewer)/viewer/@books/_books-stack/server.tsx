import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/status/status-code-view";
import { getAllBooks } from "@/features/books/actions/get-books";
import { loggerError } from "@/pino";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { BooksStackClient } from "./client";

export async function BooksStack() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const data = await getAllBooks();

		return <BooksStackClient data={data} />;
	} catch (error) {
		loggerError("unexpected", { caller: "BooksStack", status: 500 }, error);
		return <StatusCodeView statusCode="500" />;
	}
}
