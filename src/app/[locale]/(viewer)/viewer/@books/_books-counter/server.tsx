import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getStaticBooksCount } from "@/features/viewer/actions/static-books";
import { BooksCounterClient } from "./client";

export async function BooksCounter() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	const totalContents = await getStaticBooksCount();

	return <BooksCounterClient totalBooks={totalContents} />;
}
