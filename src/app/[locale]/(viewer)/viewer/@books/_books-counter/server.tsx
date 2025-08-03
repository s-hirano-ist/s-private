import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { getStaticBooksCount } from "@/features/viewer/actions/static-books";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { BooksCounterClient } from "./client";

export async function BooksCounter() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const totalContents = await getStaticBooksCount();

		return <BooksCounterClient totalBooks={totalContents} />;
	} catch (error) {
		return <StatusCodeView statusCode="500" />;
	}
}
