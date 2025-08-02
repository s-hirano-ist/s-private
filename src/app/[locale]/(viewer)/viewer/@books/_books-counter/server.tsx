import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getStaticBooksCount } from "@/features/viewer/actions/static-books";
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
