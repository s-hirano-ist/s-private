import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { getAllStaticBooks } from "@/features/books/actions/static-books";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { BooksStackClient } from "./client";

export async function BooksStack() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const previewCardData = await getAllStaticBooks();

		return <BooksStackClient previewCardData={previewCardData} />;
	} catch (error) {
		return <StatusCodeView statusCode="500" />;
	}
}
